export type VariableMap = {[key: string]: () => Promise<any>};

export class Context {
    private readonly variables: {[key: string]: (() => Promise<any>) | Promise<any>};

    public constructor(variables: VariableMap) {
        this.variables = variables;
    }

    public getVariable(name: string): Promise<any> {
        let variable = this.variables[name];

        if (variable === undefined) {
            return Promise.resolve(undefined);
        }

        if (typeof variable === 'function') {
            variable = variable();
            this.variables[name] = variable;
        }

        return variable;
    }
}
