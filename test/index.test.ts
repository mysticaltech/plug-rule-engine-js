import croct from '@croct/plug';
import {PluginFactory, PluginSdk} from '@croct/plug/plugin';
import {createPluginSdkMock} from './mocks';
import RuleEnginePlugin, {Options} from '../src/plugin';
import '../src/index';

jest.mock('@croct/plug', () => ({
    default: {
        extend: jest.fn(),
    },
    __esModule: true,
}));

jest.mock('../src/plugin', () => {
    const actual = jest.requireActual('../src/plugin');

    return {
        ...actual,
        default: jest.fn(),
        __esModule: true,
    };
});

describe('A rule engine plugin installer', () => {
    test('should register the plugin', () => {
        expect(croct.extend).toBeCalledWith('rules', expect.anything());

        const [, factory]: [string, PluginFactory] = (croct.extend as jest.Mock).mock.calls[0];

        const sdk: PluginSdk = createPluginSdkMock();

        const options: Options = {
            extensions: {
                foo: true,
                bar: false,
            },
            onPageLoad: true,
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

        factory({options: options, sdk: sdk});

        expect(RuleEnginePlugin).toBeCalledTimes(1);
        expect(RuleEnginePlugin).toBeCalledWith(options, sdk);
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
        [
            {
                extensions: {},
                pages: {},
                onPageLoad: null,
            },
            "Expected value of type boolean at path '/onPageLoad', actual null.",
        ],
    ])('should not allow %p', (options: any, error: string) => {
        const [, factory]: [string, PluginFactory] = (croct.extend as jest.Mock).mock.calls[0];

        function create(): void {
            factory({options: options, sdk: createPluginSdkMock()});
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
                onPageLoad: true,
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
    ])('should allow %p', (options: any) => {
        const [, factory]: [string, PluginFactory] = (croct.extend as jest.Mock).mock.calls[0];

        function create(): void {
            factory({options: options, sdk: createPluginSdkMock()});
        }

        expect(create).not.toThrowError();
    });
});
