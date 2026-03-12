/**
 * Build a deterministic LoRA adapter name from base model and task ID.
 * Must match the broker-side naming in lora/manager.go MakeAdapterName().
 */
export function makeAdapterName(baseModel: string, taskId: string): string {
    const sanitized = baseModel
        .replace(/\//g, '-')
        .replace(/\./g, '-')
        .replace(/ /g, '-')
    const short = taskId.length > 12 ? taskId.slice(0, 12) : taskId
    return `ft-${sanitized}-${short}`
}
