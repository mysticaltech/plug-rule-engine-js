import croct from '@croct/plug';
import '../src/index';
import {PluginFactory, PluginSdk} from '@croct/plug/plugin';
import {createPluginSdkMock} from './mocks';
import RuleEnginePlugin, {Definitions} from '../src/plugin';

jest.mock('@croct/plug', () => ({
    default: {
        extend: jest.fn(),
    },
}));

jest.mock('../src/plugin', () => {
    const actual = jest.requireActual('../src/plugin');

    return {
        ...actual,
        default: jest.fn(),
    };
});

describe('A rule engine plugin installer', () => {
    test('should register the plugin', () => {
        expect(croct.extend).toBeCalledWith('rules', expect.anything());

        const [, factory]: [string, PluginFactory] = (croct.extend as jest.Mock).mock.calls[0];

        const sdk: PluginSdk = createPluginSdkMock();

        const definitions: Definitions = {
            extensions: {
                foo: true,
                bar: false,
            },
            pages: {
                home: [
                    {
                        rules: [
                            {
                                name: 'foo',
                                properties: {
                                    foo: 'bar',
                                },
                            },
                        ],
                    },
                ],
            },
        };

        factory({options: definitions, sdk: sdk});

        expect(RuleEnginePlugin).toBeCalledTimes(1);
        expect(RuleEnginePlugin).toBeCalledWith(definitions, sdk);
    });

    test.each<[any, string]>([
        [
            {},
            "Missing property '/extensions'.",
        ],
        [
            {extensions: {}},
            "Missing property '/pages'.",
        ],
        [
            {extensions: null, pages: {}},
            "Expected value of type object at path '/extensions', actual null.",
        ],
        [
            {extensions: {foo: true}, pages: null},
            "Expected value of type object at path '/pages', actual null.",
        ],
        [
            {
                extensions: {},
                pages: {
                    home: null,
                },
            },
            "Expected value of type array at path '/pages/home', actual null.",
        ],
        [
            {
                extensions: {},
                pages: {
                    home: [
                        null,
                    ],
                },
            },
            "Expected value of type object at path '/pages/home/0', actual null.",
        ],
        [
            {
                extensions: {},
                pages: {
                    home: [
                        {},
                    ],
                },
            },
            "Missing property '/pages/home/0/rules'.",
        ],
        [
            {
                extensions: {},
                pages: {
                    home: [
                        {
                            rules: null,
                        },
                    ],
                },
            },
            "Expected value of type array at path '/pages/home/0/rules', actual null.",
        ],
        [
            {
                extensions: {},
                pages: {
                    home: [
                        {
                            rules: [
                                null,
                            ],
                        },
                    ],
                },
            },
            "Expected value of type object at path '/pages/home/0/rules/0', actual null.",
        ],
        [
            {
                extensions: {},
                pages: {
                    home: [
                        {
                            rules: [
                                {},
                            ],
                        },
                    ],
                },
            },
            "Missing property '/pages/home/0/rules/0/name'.",
        ],
        [
            {
                extensions: {},
                pages: {
                    home: [
                        {
                            rules: [
                                {
                                    name: 'foo',
                                },
                            ],
                        },
                    ],
                },
            },
            "Missing property '/pages/home/0/rules/0/properties'.",
        ],
        [
            {
                extensions: {},
                pages: {
                    home: [
                        {
                            rules: [
                                {
                                    name: 'foo',
                                    properties: null,
                                },
                            ],
                        },
                    ],
                },
            },
            "Expected value of type object at path '/pages/home/0/rules/0/properties', actual null.",
        ],
        [
            {
                extensions: {},
                pages: {
                    home: [
                        {
                            rules: [
                                {
                                    name: '',
                                    properties: {},
                                },
                            ],
                        },
                    ],
                },
            },
            "Expected at least 1 character at path '/pages/home/0/rules/0/name', actual 0.",
        ],
    ])('should not allow %p', (definitions: any, error: string) => {
        const [, factory]: [string, PluginFactory] = (croct.extend as jest.Mock).mock.calls[0];

        function create(): void {
            factory({options: definitions, sdk: createPluginSdkMock()});
        }

        expect(create).toThrow(error);
    });

    test.each<[any]>([
        [
            {
                extensions: {},
                pages: {},
            },
        ],
        [
            {
                extensions: {
                    foo: 'bar',
                },
                pages: {
                    home: [
                        {
                            rules: [
                                {
                                    name: 'firstRule',
                                    properties: {
                                        someProperty: 'someValue',
                                    },
                                },
                            ],
                        },
                    ],
                },
            },
        ],
    ])('should allow %p', (definitions: any) => {
        const [, factory]: [string, PluginFactory] = (croct.extend as jest.Mock).mock.calls[0];

        function create(): void {
            factory({options: definitions, sdk: createPluginSdkMock()});
        }

        expect(create).not.toThrowError();
    });
});
