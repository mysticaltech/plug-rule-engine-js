import {PluginSdk} from '@croct/plug/plugin';
import {Context, VariableMap} from './context';
import {Predicate} from './predicate';
import {Rule} from './rule';

export type ExtensionArguments<T = any> = {
    options: T,
    sdk: PluginSdk,
}

export type ExtensionFactory<T = any> = {
    (args: ExtensionArguments<T>): Extension,
}

export interface Extension {
    enable?(path: string): Promise<void> | void;

    getPriority?(): number;

    getVariables?(): VariableMap;

    getPredicate?(rule: Rule): Predicate | null;

    apply?(rule: Rule, context: Context): Promise<void> | void;

    disable?(): Promise<void> | void;
}
