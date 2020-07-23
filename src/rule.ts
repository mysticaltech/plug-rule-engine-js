export interface RuleProperties {
    [key: string]: any;
}

export type Rule = {
    name: string,
    properties: RuleProperties,
};

export type RuleSet = {
    rules: Rule[],
};
