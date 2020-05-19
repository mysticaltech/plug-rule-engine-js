import croct from '@croct/plug';
import RuleEnginePlugin, {Definitions, definitionsSchema} from './plugin';

declare module '@croct/plug/plug' {
    export interface PluginConfigurations {
        rules?: Definitions;
    }
}

croct.extend('rules', ({options, sdk}) => {
    definitionsSchema.validate(options);

    return new RuleEnginePlugin(options, sdk);
});
