import {Context} from './context';

export interface Predicate {
    test(context: Context): Promise<boolean>;
    print(context: Context): Promise<string>;
    toString(): string;
}

export class Contains implements Predicate {
    private readonly variable: string;

    private readonly value: any;

    public constructor(variable: string, value: any) {
        this.variable = variable;
        this.value = value;
    }

    public test(context: Context): Promise<boolean> {
        return context.getVariable(this.variable)
            .then(value => Array.isArray(value) && value.includes(this.value));
    }

    public print(context: Context): Promise<string> {
        return context.getVariable(this.variable)
            .then(value => `${JSON.stringify(value)} contains ${JSON.stringify(this.value)}`);
    }

    public toString(): string {
        return `${this.variable} contains ${JSON.stringify(this.value)}`;
    }
}

export class Not implements Predicate {
    private readonly predicate: Predicate;

    public constructor(predicate: Predicate) {
        this.predicate = predicate;
    }

    public test(context: Context): Promise<boolean> {
        return this.predicate.test(context).then(result => !result);
    }

    public print(context: Context): Promise<string> {
        return this.predicate.print(context).then(output => `not(${output})`);
    }

    public toString(): string {
        return `not(${this.predicate})`;
    }
}

export class And implements Predicate {
    private readonly predicates: Predicate[];

    public constructor(left: Predicate, right: Predicate, ...predicates: Predicate[]) {
        predicates.unshift(left, right);

        this.predicates = predicates;
    }

    public test(context: Context): Promise<boolean> {
        // Short-circuit evaluation: resolves the promise to false as soon as the first evaluates to false
        return new Promise(resolve => {
            const promises: Promise<boolean>[] = [];

            for (const predicate of this.predicates) {
                const promise = predicate.test(context).catch(() => false);

                promises.push(promise);

                promise.then(result => {
                    if (!result) {
                        resolve(false);
                    }
                });
            }

            Promise.all(promises).then(results => resolve(results.every(result => result)));
        });
    }

    public print(context: Context): Promise<string> {
        return Promise.all(this.predicates.map(predicate => predicate.print(context)))
            .then(outputs => outputs.join(' and '));
    }

    public toString(): string {
        return this.predicates.join(' and ');
    }
}

export class Or implements Predicate {
    private readonly predicates: Predicate[];

    public constructor(left: Predicate, right: Predicate, ...predicates: Predicate[]) {
        predicates.unshift(left, right);

        this.predicates = predicates;
    }

    public test(context: Context): Promise<boolean> {
        // Short-circuit evaluation: resolves the promise to true as soon as the first evaluates to true
        return new Promise(resolve => {
            const promises: Promise<boolean>[] = [];

            for (const predicate of this.predicates) {
                const promise = predicate.test(context).catch(() => false);

                promises.push(promise);

                promise.then(result => {
                    if (result) {
                        resolve(true);
                    }

                    return result;
                });
            }

            Promise.all(promises).then(results => resolve(results.some(result => result)));
        });
    }

    public print(context: Context): Promise<string> {
        return Promise.all(this.predicates.map(predicate => predicate.print(context)))
            .then(outputs => outputs.join(' or '));
    }

    public toString(): string {
        return this.predicates.join(' or ');
    }
}

export class Constant implements Predicate {
    private readonly value: boolean;

    public constructor(value: boolean) {
        this.value = value;
    }

    public test(): Promise<boolean> {
        return Promise.resolve(this.value);
    }

    public print(): Promise<string> {
        return Promise.resolve(`constant(${this.value})`);
    }

    public toString(): string {
        return `constant(${this.value})`;
    }
}

export class Variable implements Predicate {
    private readonly name: string;

    public constructor(name: string) {
        this.name = name;
    }

    public test(context: Context): Promise<boolean> {
        return context.getVariable(this.name).then(value => value === true);
    }

    public print(context: Context): Promise<string> {
        return context.getVariable(this.name)
            .then(value => `variable('${this.name}' = ${value})`);
    }

    public toString(): string {
        return `variable('${this.name}')`;
    }
}
