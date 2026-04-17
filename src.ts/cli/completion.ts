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

function functionName(parts: string[]): string {
    return '_' + parts.join('_').replace(/-/g, '_')
}

function generateLeafFunction(
    nameParts: string[],
    options: Option[]
): string[] {
    if (options.length === 0) return []

    const lines: string[] = []
    const fnName = functionName(nameParts)

    lines.push(`${fnName}() {`)
    lines.push(`    _arguments -s \\`)
    for (let i = 0; i < options.length; i++) {
        const specs = formatOptionSpec(options[i])
        for (const spec of specs) {
            lines.push(`        ${spec} \\`)
        }
    }
    const lastIdx = lines.length - 1
    lines[lastIdx] = lines[lastIdx].replace(/ \\$/, '')
    lines.push(`}`)
    return lines
}

function generateGroupFunction(
    nameParts: string[],
    subcommands: Command[]
): string[] {
    const lines: string[] = []
    const fnName = functionName(nameParts)

    lines.push(`${fnName}() {`)
    lines.push(`    local -a subcmds`)
    lines.push(`    subcmds=(`)
    for (const sub of subcommands) {
        const desc = escapeZsh(sub.description() || '')
        lines.push(`        '${escapeZsh(sub.name())}:${desc}'`)
        const alias = sub.alias()
        if (alias) {
            lines.push(`        '${escapeZsh(alias)}:${desc}'`)
        }
    }
    lines.push(`    )`)
    lines.push(`    _describe -t commands 'command' subcmds`)
    lines.push(`}`)
    return lines
}

function generateAllFunctions(
    cmd: Command,
    nameParts: string[]
): string[] {
    const lines: string[] = []
    const subcommands = visibleCommands(cmd)

    if (subcommands.length > 0) {
        lines.push(...generateGroupFunction(nameParts, subcommands))
        lines.push(``)
    }

    for (const sub of subcommands) {
        const childParts = [...nameParts, sub.name()]
        const nested = visibleCommands(sub)
        const options = (sub.options as Option[]) || []

        if (nested.length > 0) {
            lines.push(...generateAllFunctions(sub, childParts))
        } else {
            const fn = generateLeafFunction(childParts, options)
            if (fn.length > 0) {
                lines.push(...fn)
                lines.push(``)
            }
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

    lines.push(...generateAllFunctions(program, [safeName]))

    const topSubcommands = visibleCommands(program)

    lines.push(`_${safeName}_main() {`)
    lines.push(`    local curcontext="$curcontext" state line`)
    lines.push(`    typeset -A opt_args`)
    lines.push(``)
    lines.push(`    _arguments -C \\`)
    lines.push(`        '(-h --help)'{-h,--help}'[display help]' \\`)
    lines.push(`        '(-V --version)'{-V,--version}'[output version]' \\`)
    lines.push(`        '1:command:->cmds' \\`)
    lines.push(`        '*::arg:->args'`)
    lines.push(``)
    lines.push(`    case "$state" in`)
    lines.push(`    cmds)`)
    lines.push(`        _${safeName}`)
    lines.push(`        ;;`)
    lines.push(`    args)`)
    lines.push(`        local cmd="$line[1]"`)
    lines.push(`        case "$cmd" in`)

    for (const sub of topSubcommands) {
        const nested = visibleCommands(sub)
        const subOpts = (sub.options as Option[]) || []

        const patterns = [escapeZsh(sub.name())]
        if (sub.alias()) patterns.push(escapeZsh(sub.alias()!))
        const pattern = patterns.join('|')

        if (nested.length > 0) {
            const groupFn = functionName([safeName, sub.name()])
            lines.push(`        ${pattern})`)
            lines.push(`            local subcmd="$line[2]"`)
            lines.push(`            if (( CURRENT == 2 )); then`)
            lines.push(`                ${groupFn}`)
            lines.push(`            else`)
            lines.push(`                case "$subcmd" in`)

            for (const n of nested) {
                const nFn = functionName([safeName, sub.name(), n.name()])
                const nOpts = (n.options as Option[]) || []
                const nPatterns = [escapeZsh(n.name())]
                if (n.alias()) nPatterns.push(escapeZsh(n.alias()!))

                if (nOpts.length > 0) {
                    lines.push(`                ${nPatterns.join('|')})`)
                    lines.push(`                    ${nFn}`)
                    lines.push(`                    ;;`)
                }
            }
            lines.push(`                esac`)
            lines.push(`            fi`)
            lines.push(`            ;;`)
        } else if (subOpts.length > 0) {
            const leafFn = functionName([safeName, sub.name()])
            lines.push(`        ${pattern})`)
            lines.push(`            ${leafFn}`)
            lines.push(`            ;;`)
        }
    }

    lines.push(`        esac`)
    lines.push(`        ;;`)
    lines.push(`    esac`)
    lines.push(`}`)
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
