import type { Command, Option } from 'commander'

function escapeZsh(s: string): string {
    return s
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "'\\''")
        .replace(/\$/g, '\\$')
        .replace(/:/g, '\\:')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
}

function formatOptionSpec(opt: Option): string[] {
    const flags: string[] = []
    if (opt.short) flags.push(opt.short)
    if (opt.long) flags.push(opt.long)
    if (flags.length === 0) return []

    const desc = escapeZsh(opt.description || '')
    const argSuffix = opt.required || opt.optional ? ':arg:' : ''
    const escapedFlags = flags.map(escapeZsh)

    if (flags.length > 1) {
        const exclusion = `(${escapedFlags.join(' ')})`
        const brace = `{${escapedFlags.join(',')}}`
        return [`'${exclusion}'${brace}'[${desc}]${argSuffix}'`]
    }
    return [`'${escapedFlags[0]}[${desc}]${argSuffix}'`]
}

function visibleCommands(cmd: Command): Command[] {
    // Commander stores hidden state as `_hidden` on Command (no public getter
    // exists — only Option has a public `hidden` property). If Commander ever
    // exposes a public getter, switch to that.
    return cmd.commands.filter(
        (c: Command) =>
            !(c as Command & { _hidden?: boolean })._hidden &&
            c.name() !== 'completion'
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
    cmd: Command,
    overrideName?: string
): string[] {
    const lines: string[] = []
    const subcommands = visibleCommands(cmd)
    const name = overrideName ?? fnName(nameParts)

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

    // Main dispatcher: named _X_main but children use [safeName] base
    // so nested dispatch references match generateAll's function names.
    const mainLines = generateDispatcher(
        [safeName],
        program,
        fnName([safeName, 'main'])
    )
    // Add --version (only at the top level)
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
    const cliName = program.name()

    program
        .command('completion')
        .description('Generate shell completion script')
        .argument('<shell>', 'Shell type (zsh)')
        .addHelpText(
            'after',
            `
Setup:

  Option 1 - Add to .zshrc (simplest, slower shell startup):

    echo 'eval "$(${cliName} completion zsh)"' >> ~/.zshrc

  Option 2 - Cache to file (recommended, zero startup cost):

    mkdir -p ~/.zsh/completions
    ${cliName} completion zsh > ~/.zsh/completions/_${cliName}

    # Add these lines to ~/.zshrc (once):
    fpath=(~/.zsh/completions $fpath)
    autoload -Uz compinit && compinit

  After upgrading ${cliName}, re-run the command to update completions.
`
        )
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
