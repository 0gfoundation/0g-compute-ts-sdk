import type { Command, Option } from 'commander'

function escapeZsh(s: string): string {
    return s
        .replace(/'/g, "'\\''")
        .replace(/:/g, '\\:')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
}

function formatOptionSpec(opt: Option): string[] {
    const flags: string[] = []
    if (opt.short) flags.push(opt.short)
    if (opt.long) flags.push(opt.long)

    const desc = escapeZsh(opt.description || '')
    const takesArg = opt.required || opt.optional

    return flags.map((flag) => {
        const escapedFlag = escapeZsh(flag)
        if (takesArg) {
            return `'${escapedFlag}[${desc}]:arg:'`
        }
        return `'${escapedFlag}[${desc}]'`
    })
}

function visibleCommands(cmd: Command): Command[] {
    return cmd.commands.filter(
        (c: Command) => !(c as any)._hidden && c.name() !== 'completion'
    )
}

function fnName(parts: string[]): string {
    return '_' + parts.join('_').replace(/-/g, '_')
}

function generateLeafFunction(
    nameParts: string[],
    options: Option[]
): string[] {
    if (options.length === 0) return []

    const lines: string[] = []
    lines.push(`${fnName(nameParts)}() {`)
    lines.push(`    _arguments -s \\`)
    for (const opt of options) {
        for (const spec of formatOptionSpec(opt)) {
            lines.push(`        ${spec} \\`)
        }
    }
    const lastIdx = lines.length - 1
    lines[lastIdx] = lines[lastIdx].replace(/ \\$/, '')
    lines.push(`}`)
    return lines
}

function generateDispatcher(
    nameParts: string[],
    cmd: Command
): string[] {
    const lines: string[] = []
    const subcommands = visibleCommands(cmd)
    const name = fnName(nameParts)

    lines.push(`${name}() {`)
    lines.push(`    local curcontext="$curcontext" state line`)
    lines.push(`    typeset -A opt_args`)
    lines.push(``)
    lines.push(`    _arguments -C \\`)
    lines.push(`        '(-h --help)'{-h,--help}'[display help]' \\`)
    lines.push(`        '1:command:->cmds' \\`)
    lines.push(`        '*::arg:->args'`)
    lines.push(``)
    lines.push(`    case "$state" in`)
    lines.push(`    cmds)`)
    lines.push(`        local -a commands`)
    lines.push(`        commands=(`)
    for (const sub of subcommands) {
        const desc = escapeZsh(sub.description() || '')
        lines.push(`            '${escapeZsh(sub.name())}:${desc}'`)
        const alias = sub.alias()
        if (alias) {
            lines.push(`            '${escapeZsh(alias)}:${desc}'`)
        }
    }
    lines.push(`        )`)
    lines.push(`        _describe -t commands 'command' commands`)
    lines.push(`        ;;`)
    lines.push(`    args)`)
    lines.push(`        case "$line[1]" in`)

    for (const sub of subcommands) {
        const nested = visibleCommands(sub)
        const subOpts = (sub.options as Option[]) || []
        const childParts = [...nameParts, sub.name()]

        const patterns = [escapeZsh(sub.name())]
        if (sub.alias()) patterns.push(escapeZsh(sub.alias()!))

        if (nested.length > 0 || subOpts.length > 0) {
            lines.push(`        ${patterns.join('|')})`)
            lines.push(`            ${fnName(childParts)}`)
            lines.push(`            ;;`)
        }
    }

    lines.push(`        esac`)
    lines.push(`        ;;`)
    lines.push(`    esac`)
    lines.push(`}`)
    return lines
}

function generateAll(
    cmd: Command,
    nameParts: string[]
): string[] {
    const lines: string[] = []
    const subcommands = visibleCommands(cmd)

    for (const sub of subcommands) {
        const childParts = [...nameParts, sub.name()]
        const nested = visibleCommands(sub)
        const options = (sub.options as Option[]) || []

        if (nested.length > 0) {
            lines.push(...generateAll(sub, childParts))
            lines.push(...generateDispatcher(childParts, sub))
            lines.push(``)
        } else if (options.length > 0) {
            lines.push(...generateLeafFunction(childParts, options))
            lines.push(``)
        }
    }

    return lines
}

export function generateZshCompletion(program: Command): string {
    const cliName = program.name()
    const safeName = cliName.replace(/-/g, '_')
    const lines: string[] = []

    lines.push(`#compdef ${cliName}`)
    lines.push(`# ${cliName} v${program.version()} zsh completion`)
    lines.push(`# Generated automatically - do not edit by hand`)
    lines.push(``)

    lines.push(...generateAll(program, [safeName]))

    const mainLines = generateDispatcher([safeName, 'main'], program)
    // Patch the main one to also include --version
    const versionIdx = mainLines.findIndex((l) =>
        l.includes("'(-h --help)'")
    )
    if (versionIdx >= 0) {
        mainLines.splice(
            versionIdx + 1,
            0,
            `        '(-V --version)'{-V,--version}'[output version]' \\`
        )
    }
    lines.push(...mainLines)
    lines.push(``)
    lines.push(`compdef _${safeName}_main ${cliName}`)
    lines.push(``)

    return lines.join('\n')
}

export default function completion(program: Command): void {
    program
        .command('completion')
        .description('Generate shell completion script')
        .argument('<shell>', 'Shell type (zsh)')
        .action((shell: string) => {
            if (shell !== 'zsh') {
                console.error(
                    `Unsupported shell: ${shell}. Currently only "zsh" is supported.`
                )
                process.exit(1)
            }
            const script = generateZshCompletion(program)
            process.stdout.write(script)
            process.exit(0)
        })
}
