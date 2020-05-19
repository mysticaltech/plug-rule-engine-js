import {Logger} from '@croct/plug/sdk';
import {Plugin, PluginSdk} from '@croct/plug/plugin';
import {And, Constant, Predicate} from './predicate';
import {Context, VariableMap} from './context';
import {Extension, ExtensionFactory} from './extension';
import {Rule, RuleSet} from './rule';

interface ExtensionConfigurations {
    [key: string]: any;
}

export type Definitions = {
    extensions: ExtensionConfigurations,
    pages: {[key: string]: RuleSet[]},
}

const EXTENSION_NAMESPACE = 'extension';

export class RuleEnginePlugin implements Plugin {
    private static extensionRegistry: {[key: string]: ExtensionFactory} = {};

    private readonly definitions: Definitions;

    private readonly sdk: PluginSdk;

    private readonly logger: Logger;

    private extensions?: Extension[];

    public constructor(definitions: Definitions, sdk: PluginSdk) {
        this.definitions = definitions;
        this.sdk = sdk;
        this.logger = sdk.getLogger();
    }

    public static extend(name: string, expression: ExtensionFactory): void {
        RuleEnginePlugin.extensionRegistry[name] = expression;
    }

    public async enable(): Promise<void> {
        const {location} = this.sdk.tab;
        const path = location.pathname + location.search + location.hash;

        const pending: Promise<any>[] = [];
        for (const extension of this.getExtensions()) {
            if (typeof extension.enable !== 'function') {
                continue;
            }

            const promise = extension.enable(path);

            if (promise instanceof Promise) {
                pending.push(promise);
            }
        }

        if (pending.length > 0) {
            await Promise.all(pending.splice(0));
        }

        const context = this.createContext();

        for (const [pattern, ruleSet] of Object.entries(this.definitions.pages)) {
            if (!(new RegExp(pattern).test(path))) {
                continue;
            }

            this.logger.debug(`Pattern "${pattern}" matches path "${path}".`);

            for (let index = 0; index < ruleSet.length; index++) {
                pending.push(this.applyRuleSet(ruleSet[index], context));
            }
        }

        await Promise.all(pending);
    }

    public async disable(): Promise<void> {
        const pending: Promise<any>[] = [];
        for (const extension of this.getExtensions()) {
            if (typeof extension.disable !== 'function') {
                continue;
            }

            const promise = extension.disable();

            if (promise instanceof Promise) {
                pending.push(promise);
            }
        }

        await Promise.all(pending);
    }

    private async applyRuleSet(ruleSet: RuleSet, context: Context): Promise<void> {
        const extensions = this.getExtensions();

        for (const rule of ruleSet.rules) {
            const predicate = this.getPredicate(rule);

            this.logger.debug(`Evaluating rule "${rule.name}": ${predicate}.`);

            const match = await predicate.test(context);

            this.logger.debug(`Rule "${rule.name}" ${match ? 'matches' : 'does not match'}.`);

            if (!match) {
                continue;
            }

            const pending = [];
            for (const extension of extensions) {
                if (extension.apply !== undefined) {
                    pending.push(extension.apply(rule, context));
                }
            }

            await Promise.all(pending);

            return;
        }
    }

    private getPredicate(rule: Rule): Predicate {
        let predicate = null;
        const extensions = this.getExtensions();

        for (let index = 0; index < extensions.length; index++) {
            const extension = extensions[index];

            if (extension.getPredicate !== undefined) {
                const operand = extension.getPredicate(rule);

                if (operand !== null) {
                    predicate = predicate === null ? operand : new And(predicate, operand);
                }
            }
        }

        return predicate ?? new Constant(true);
    }

    private createContext(): Context {
        const variables: VariableMap[] = [];

        for (const extension of this.getExtensions()) {
            if (extension.getVariables !== undefined) {
                variables.push(extension.getVariables());
            }
        }

        return new Context(Object.assign({}, ...variables));
    }

    private getExtensions(): Extension[] {
        if (this.extensions !== undefined) {
            return this.extensions;
        }

        this.extensions = [];
        for (const [name, options] of Object.entries(this.definitions.extensions)) {
            const factory = RuleEnginePlugin.extensionRegistry[name];

            if (factory === undefined) {
                this.logger.error(`Unknown extension "${name}".`);

                continue;
            }

            const extension = factory({
                options: options,
                sdk: {
                    tracker: this.sdk.tracker,
                    evaluator: this.sdk.evaluator,
                    user: this.sdk.user,
                    session: this.sdk.session,
                    tab: this.sdk.tab,
                    getLogger: (...namespace: string[]): Logger => {
                        return this.sdk.getLogger(EXTENSION_NAMESPACE, name, ...namespace);
                    },
                    getTabStorage: (...namespace: string[]): Storage => {
                        return this.sdk.getTabStorage(EXTENSION_NAMESPACE, name, ...namespace);
                    },
                    getBrowserStorage: (...namespace: string[]): Storage => {
                        return this.sdk.getBrowserStorage(EXTENSION_NAMESPACE, name, ...namespace);
                    },
                },
            });

            this.extensions.push(extension);

            this.logger.debug(`Extension "${name}" initialized.`);
        }

        return this.extensions.sort((left, right) => {
            let leftPriority = 0;

            if (typeof left.getPriority === 'function') {
                leftPriority = left.getPriority();
            }

            let rightPriority = 0;

            if (typeof right.getPriority === 'function') {
                rightPriority = right.getPriority();
            }

            return leftPriority - rightPriority;
        });
    }
}
