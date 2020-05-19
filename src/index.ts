import croct from '@croct/plug';
import {Definitions, RuleEnginePlugin} from './plugin';

declare module '@croct/plug/plug' {
    export interface PluginConfigurations {
        rules?: Definitions;
    }
}

croct.extend('rules', ({options, sdk}) => new RuleEnginePlugin(options, sdk));
