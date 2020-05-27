import croct from '@croct/plug';
import {PluginArguments} from '@croct/plug/plugin';
import RuleEnginePlugin, {Options, optionsSchema} from './plugin';

declare module '@croct/plug/plug' {
    export interface PluginConfigurations {
        rules?: Options | false;
    }
}

croct.extend('rules', ({options, sdk}: PluginArguments<Options>) => {
    optionsSchema.validate(options);

    return new RuleEnginePlugin(
        {
            ...options,
            onPageLoad: options.onPageLoad ?? true,
        },
        sdk,
    );
});
