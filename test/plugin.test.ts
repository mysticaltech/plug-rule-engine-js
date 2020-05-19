import {Extension, ExtensionFactory} from '../src/extension';
import RuleEnginePlugin, {Definitions} from '../src/plugin';
import {Constant, Variable} from '../src/predicate';
import {Rule} from '../src/rule';
import {createPluginSdkMock, getLoggerMock} from './mocks';
import 'jest-extended';

beforeEach(() => {
    // eslint-disable-next-line
    RuleEnginePlugin['extensionRegistry'] = {};
    window.history.replaceState({}, 'Home Page', '/homepage');
});

describe('A rule engine plugin', () => {
    test('should apply all steps matching a given path', async () => {
        const fooExtension: Extension = {
            apply: jest.fn(),
            getPredicate: jest.fn()
                .mockReturnValueOnce(new Constant(false))
                .mockReturnValueOnce(new Constant(true))
                .mockReturnValueOnce(new Constant(true)),
        };

        RuleEnginePlugin.extend('foo', () => fooExtension);

        const firstRule: Rule = {name: 'firstRule', properties: {}};
        const secondRule: Rule = {name: 'secondRule', properties: {}};
        const thirdRule: Rule = {name: 'thirdRule', properties: {}};
        const fourthRule: Rule = {name: 'fourthRule', properties: {}};

        const definitions: Definitions = {
            extensions: {
                foo: true,
            },
            pages: {
                'homepage\\?foo=bar#anchor': [
                    {
                        rules: [firstRule],
                    },
                    {
                        rules: [secondRule],
                    },
                ],
                page: [
                    {
                        rules: [thirdRule],
                    },
                ],
                other: [
                    {
                        rules: [fourthRule],
                    },
                ],
            },
        };

        const sdk = createPluginSdkMock();
        const engine = new RuleEnginePlugin(definitions, sdk);

        window.history.replaceState({}, 'Home page', '/homepage?foo=bar#anchor');

        await engine.enable();

        expect(fooExtension.getPredicate).toHaveBeenCalledTimes(3);
        expect(fooExtension.getPredicate).toHaveBeenNthCalledWith(1, firstRule);
        expect(fooExtension.getPredicate).toHaveBeenNthCalledWith(2, secondRule);
        expect(fooExtension.getPredicate).toHaveBeenNthCalledWith(3, thirdRule);
        expect(fooExtension.apply).toHaveBeenCalledTimes(2);
        expect(fooExtension.apply).toHaveBeenNthCalledWith(1, secondRule, expect.anything());
        expect(fooExtension.apply).toHaveBeenNthCalledWith(2, thirdRule, expect.anything());
    });

    test('should run extensions considering their priority', async () => {
        const barExtension: Extension = {
            enable: jest.fn(),
            apply: jest.fn(),
            getPredicate: jest.fn().mockReturnValueOnce(new Constant(true)),
            getVariables: jest.fn(),
            disable: jest.fn(),
            getPriority: jest.fn().mockReturnValue(-2),
        };

        const quxExtension: Extension = {
            enable: jest.fn(),
            apply: jest.fn(),
            getPredicate: jest.fn().mockReturnValueOnce(new Constant(true)),
            getVariables: jest.fn(),
            disable: jest.fn(),
        };

        const fooExtension: Extension = {
            enable: jest.fn(),
            apply: jest.fn(),
            getPredicate: jest.fn().mockReturnValueOnce(new Constant(true)),
            getVariables: jest.fn(),
            disable: jest.fn(),
            getPriority: jest.fn().mockReturnValue(1),
        };

        const bazExtension: Extension = {
            enable: jest.fn(),
            apply: jest.fn(),
            getPredicate: jest.fn().mockReturnValueOnce(new Constant(true)),
            getVariables: jest.fn(),
            disable: jest.fn(),
            getPriority: jest.fn().mockReturnValue(2),
        };

        RuleEnginePlugin.extend('bar', () => barExtension);
        RuleEnginePlugin.extend('qux', () => quxExtension);
        RuleEnginePlugin.extend('foo', () => fooExtension);
        RuleEnginePlugin.extend('baz', () => bazExtension);

        const rule: Rule = {name: 'rule', properties: {}};

        const definitions: Definitions = {
            extensions: {
                foo: true,
                bar: true,
                baz: true,
                qux: true,
            },
            pages: {
                '/': [
                    {
                        rules: [rule],
                    },
                ],
            },
        };

        const sdk = createPluginSdkMock();
        const engine = new RuleEnginePlugin(definitions, sdk);

        await engine.enable();
        await engine.disable();

        expect(barExtension.enable).toHaveBeenCalledBefore(quxExtension.enable as jest.Mock);
        expect(quxExtension.enable).toHaveBeenCalledBefore(fooExtension.enable as jest.Mock);
        expect(fooExtension.enable).toHaveBeenCalledBefore(bazExtension.enable as jest.Mock);

        expect(barExtension.apply).toHaveBeenCalledBefore(quxExtension.apply as jest.Mock);
        expect(quxExtension.apply).toHaveBeenCalledBefore(fooExtension.apply as jest.Mock);
        expect(fooExtension.apply).toHaveBeenCalledBefore(bazExtension.apply as jest.Mock);

        expect(barExtension.getPredicate).toHaveBeenCalledBefore(quxExtension.getPredicate as jest.Mock);
        expect(quxExtension.getPredicate).toHaveBeenCalledBefore(fooExtension.getPredicate as jest.Mock);
        expect(fooExtension.getPredicate).toHaveBeenCalledBefore(bazExtension.getPredicate as jest.Mock);

        expect(barExtension.getVariables).toHaveBeenCalledBefore(quxExtension.getVariables as jest.Mock);
        expect(quxExtension.getVariables).toHaveBeenCalledBefore(fooExtension.getVariables as jest.Mock);
        expect(fooExtension.getVariables).toHaveBeenCalledBefore(bazExtension.getVariables as jest.Mock);

        expect(barExtension.disable).toHaveBeenCalledBefore(quxExtension.disable as jest.Mock);
        expect(quxExtension.disable).toHaveBeenCalledBefore(fooExtension.disable as jest.Mock);
        expect(fooExtension.disable).toHaveBeenCalledBefore(bazExtension.disable as jest.Mock);
    });

    test('should apply rules which the predicate is satisfied', async () => {
        const fooExtension: Extension = {
            apply: jest.fn(),
            getPredicate: jest.fn()
                .mockReturnValueOnce(new Variable('a'))
                .mockReturnValueOnce(new Variable('b')),
            getVariables: jest.fn().mockReturnValueOnce({
                a: (): Promise<any> => Promise.resolve(false),
                b: (): Promise<any> => Promise.resolve(true),
            }),
        };

        RuleEnginePlugin.extend('foo', () => fooExtension);

        const firstRule: Rule = {name: 'firstRule', properties: {}};
        const secondRule: Rule = {name: 'secondRule', properties: {}};

        const definitions: Definitions = {
            extensions: {
                foo: true,
            },
            pages: {
                home: [
                    {
                        rules: [firstRule],
                    },
                    {
                        rules: [secondRule],
                    },
                ],
            },
        };

        const sdk = createPluginSdkMock();
        const engine = new RuleEnginePlugin(definitions, sdk);

        await engine.enable();

        window.history.replaceState({}, 'Home page', '/homepage');

        expect(fooExtension.getPredicate).toHaveBeenCalledTimes(2);
        expect(fooExtension.getPredicate).toHaveBeenCalledWith(firstRule);
        expect(fooExtension.getPredicate).toHaveBeenCalledWith(secondRule);
        expect(fooExtension.apply).toHaveBeenCalledTimes(1);
        expect(fooExtension.apply).toHaveBeenLastCalledWith(secondRule, expect.anything());
    });

    test('should apply a single rule per set', async () => {
        const fooExtension: Extension = {
            apply: jest.fn(),
            getPredicate: jest.fn()
                .mockReturnValueOnce(new Constant(false))
                .mockReturnValueOnce(new Constant(true)),
        };

        RuleEnginePlugin.extend('foo', () => fooExtension);

        const firstRule: Rule = {name: 'firstRule', properties: {}};
        const secondRule: Rule = {name: 'secondRule', properties: {}};
        const thirdRule: Rule = {name: 'thirdRule', properties: {}};

        const definitions: Definitions = {
            extensions: {
                foo: true,
            },
            pages: {
                home: [
                    {
                        rules: [firstRule, secondRule, thirdRule],
                    },
                ],
            },
        };

        const sdk = createPluginSdkMock();
        const engine = new RuleEnginePlugin(definitions, sdk);

        window.history.replaceState({}, 'Home page', '/homepage');

        await engine.enable();

        expect(fooExtension.getPredicate).toHaveBeenCalledTimes(2);
        expect(fooExtension.getPredicate).toHaveBeenCalledWith(firstRule);
        expect(fooExtension.getPredicate).toHaveBeenCalledWith(secondRule);
        expect(fooExtension.apply).toHaveBeenCalledTimes(1);
        expect(fooExtension.apply).toHaveBeenCalledWith(secondRule, expect.anything());
    });

    test('should combine predicates into a conjunction', async () => {
        const fooExtension: Extension = {
            apply: jest.fn(),
            disable: jest.fn(),
            enable: jest.fn(),
            getPredicate: jest.fn()
                .mockReturnValueOnce(new Constant(false))
                .mockReturnValueOnce(new Constant(true)),
            getVariables: jest.fn(),
        };

        const barExtension: Extension = {
            apply: jest.fn(),
            getPredicate: jest.fn()
                .mockReturnValueOnce(new Constant(true))
                .mockReturnValueOnce(new Constant(true)),
        };

        RuleEnginePlugin.extend('foo', () => fooExtension);
        RuleEnginePlugin.extend('bar', () => barExtension);

        const firstRule: Rule = {name: 'firstRule', properties: {}};
        const secondRule: Rule = {name: 'firstRule', properties: {}};

        const definitions: Definitions = {
            extensions: {
                foo: true,
                bar: true,
            },
            pages: {
                home: [
                    {
                        rules: [firstRule],
                    },
                    {
                        rules: [secondRule],
                    },
                ],
            },
        };

        const sdk = createPluginSdkMock();
        const engine = new RuleEnginePlugin(definitions, sdk);

        window.history.replaceState({}, 'Home page', '/homepage');

        await engine.enable();

        expect(fooExtension.getPredicate).toHaveBeenCalledTimes(2);
        expect(fooExtension.getPredicate).toHaveBeenCalledWith(firstRule);
        expect(fooExtension.getPredicate).toHaveBeenCalledWith(secondRule);
        expect(barExtension.apply).toHaveBeenCalledTimes(1);
        expect(barExtension.apply).toHaveBeenCalledWith(secondRule, expect.anything());
    });

    test('should log an error if an extension options is invalid', async () => {
        const fooExtension: Extension = {
            enable: jest.fn(),
        };

        RuleEnginePlugin.extend('foo', () => fooExtension);

        const definitions: Definitions = {
            extensions: {
                foo: null,
            },
            pages: {},
        };

        const sdk = createPluginSdkMock();
        const logger = getLoggerMock();

        sdk.getLogger = jest.fn().mockReturnValue(logger);

        const engine = new RuleEnginePlugin(definitions, sdk);

        await engine.enable();

        expect(fooExtension.enable).not.toHaveBeenCalled();

        expect(logger.error).toBeCalledWith(
            expect.stringContaining(
                'Invalid options for extension "foo", expected either boolean or object but got null',
            ),
        );
    });

    test('should log failures initializing plugins', async () => {
        RuleEnginePlugin.extend('foo', () => {
            throw new Error('failure');
        });

        const definitions: Definitions = {
            extensions: {
                foo: true,
            },
            pages: {},
        };

        const sdk = createPluginSdkMock();
        const logger = getLoggerMock();

        sdk.getLogger = jest.fn().mockReturnValue(logger);

        const engine = new RuleEnginePlugin(definitions, sdk);

        await engine.enable();

        expect(logger.error).toBeCalledWith(
            expect.stringContaining('Failed to initialize extension "foo": failure'),
        );
    });

    test('should not initialize disabled extensions', async () => {
        const fooExtension: Extension = {
            enable: jest.fn(),
        };

        const barExtension: Extension = {
            enable: jest.fn().mockReturnValue(Promise.resolve()),
        };

        RuleEnginePlugin.extend('foo', () => fooExtension);
        RuleEnginePlugin.extend('bar', () => barExtension);

        const definitions: Definitions = {
            extensions: {
                foo: false,
                bar: true,
            },
            pages: {},
        };

        const sdk = createPluginSdkMock();
        const logger = getLoggerMock();

        sdk.getLogger = jest.fn().mockReturnValue(logger);

        const engine = new RuleEnginePlugin(definitions, sdk);

        await engine.enable();

        expect(fooExtension.enable).not.toHaveBeenCalled();
        expect(barExtension.enable).toHaveBeenCalled();

        expect(logger.warn).toBeCalledWith(
            expect.stringContaining('Extension "foo" is declared but not enabled'),
        );
    });

    test('should initialize all declared extensions', async () => {
        const fooExtension: Extension = {
            enable: jest.fn(),
        };

        const barExtension: Extension = {
            enable: jest.fn().mockReturnValue(Promise.resolve()),
        };

        const fooFactory: ExtensionFactory = jest.fn().mockImplementation(() => fooExtension);
        const barFactory: ExtensionFactory = jest.fn().mockImplementation(() => barExtension);

        RuleEnginePlugin.extend('foo', fooFactory);
        RuleEnginePlugin.extend('bar', barFactory);

        const definitions: Definitions = {
            extensions: {
                foo: {},
                bar: {flag: true},
            },
            pages: {},
        };

        const sdk = createPluginSdkMock();
        const engine = new RuleEnginePlugin(definitions, sdk);

        await engine.enable();

        expect(fooFactory).toBeCalledWith(expect.objectContaining({options: {}}));
        expect(barFactory).toBeCalledWith(expect.objectContaining({options: {flag: true}}));

        expect(fooExtension.enable).toHaveBeenCalled();
        expect(barExtension.enable).toHaveBeenCalled();
    });

    test('should allow to disable all registered extensions', async () => {
        const fooExtension: Extension = {
            disable: jest.fn(),
        };

        const barExtension: Extension = {
            disable: jest.fn().mockReturnValue(Promise.resolve()),
        };

        const bazExtension: Extension = {};

        RuleEnginePlugin.extend('foo', () => fooExtension);
        RuleEnginePlugin.extend('bar', () => barExtension);
        RuleEnginePlugin.extend('baz', () => bazExtension);

        const definitions: Definitions = {
            extensions: {
                foo: true,
                bar: true,
                baz: true,
            },
            pages: {},
        };

        const sdk = createPluginSdkMock();
        const engine = new RuleEnginePlugin(definitions, sdk);

        await engine.disable();

        expect(fooExtension.disable).toHaveBeenCalled();
        expect(barExtension.disable).toHaveBeenCalled();
    });

    test('should instantiate an isolated SDK for each extension', async () => {
        const sdk = createPluginSdkMock();

        sdk.getLogger = jest.fn().mockReturnValue(getLoggerMock());
        sdk.getBrowserStorage = jest.fn().mockReturnValue(window.localStorage);
        sdk.getTabStorage = jest.fn().mockReturnValue(window.sessionStorage);

        const fooExtension = jest.fn().mockImplementation(({sdk: extensionSdk}) => {
            expect(extensionSdk.tracker).toBe(extensionSdk.tracker);
            expect(extensionSdk.evaluator).toBe(extensionSdk.evaluator);
            expect(extensionSdk.session).toBe(extensionSdk.session);
            expect(extensionSdk.user).toBe(extensionSdk.user);
            expect(extensionSdk.tab).toBe(extensionSdk.tab);

            extensionSdk.getBrowserStorage('browser');
            extensionSdk.getTabStorage('tab');
            extensionSdk.getLogger('logger');

            return {
                enable: jest.fn(),
            };
        });

        RuleEnginePlugin.extend('foo', fooExtension);

        const definitions: Definitions = {
            extensions: {
                foo: true,
            },
            pages: {
                '/': [
                    {
                        rules: [{name: 'someRule', properties: {}}],
                    },
                ],
            },
        };

        const engine = new RuleEnginePlugin(definitions, sdk);

        await engine.enable();

        expect(fooExtension).toHaveBeenCalled();
        expect(sdk.getTabStorage).toHaveBeenCalledWith('extension', 'foo', 'tab');
        expect(sdk.getBrowserStorage).toHaveBeenCalledWith('extension', 'foo', 'browser');
        expect(sdk.getLogger).toHaveBeenCalledWith('extension', 'foo', 'logger');
    });

    test('should log an error message if a registered extension is unknown', async () => {
        const definitions: Definitions = {
            extensions: {
                foo: true,
            },
            pages: {},
        };

        const sdk = createPluginSdkMock();
        const engine = new RuleEnginePlugin(definitions, sdk);

        await engine.enable();

        const logger = sdk.getLogger();

        expect(logger.error).toHaveBeenCalledWith('Unknown extension "foo".');
    });
});
