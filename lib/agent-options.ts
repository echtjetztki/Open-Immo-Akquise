export const DEFAULT_AGENT_OPTIONS = [
    'Markus',
    'Fabian',
    'Ahmed',
    'Kaloyan',
    'Viktoria',
    'Melinda',
];

export const normalizeAgentName = (value: unknown) =>
    (value ?? '').toString().trim().toLowerCase();

export function findAgentOption(input: unknown, options: string[]): string | undefined {
    const normalizedInput = normalizeAgentName(input);
    if (!normalizedInput) {
        return undefined;
    }

    return options.find((name) => normalizeAgentName(name) === normalizedInput);
}
