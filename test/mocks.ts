import {PluginSdk} from '@croct/plug/plugin';
import EvaluatorFacade from '@croct/sdk/facade/evaluatorFacade';
import TrackerFacade from '@croct/sdk/facade/trackerFacade';
import {Logger, SessionFacade, Tab, UserFacade} from '@croct/plug/sdk';

export function createPluginSdkMock(): PluginSdk {
    const {
        default: EvaluatorMock,
    } = jest.genMockFromModule<{default: {new(): EvaluatorFacade}}>('@croct/sdk/facade/evaluatorFacade');

    const {
        default: TrackerMock,
    } = jest.genMockFromModule<{default: {new(): TrackerFacade}}>('@croct/sdk/facade/trackerFacade');

    const {
        default: SessionFacadeMock,
    } = jest.genMockFromModule<{default: {new(): SessionFacade}}>('@croct/sdk/facade/sessionFacade');

    const {
        default: UserFacadeMock,
    } = jest.genMockFromModule<{default: {new(): UserFacade}}>('@croct/sdk/facade/userFacade');

    const {
        default: TabMock,
    } = jest.genMockFromModule<{default: {new(): Tab}}>('@croct/sdk/tab');

    const sdk: PluginSdk = {
        evaluator: new EvaluatorMock(),
        session: new SessionFacadeMock(),
        tab: new TabMock(),
        tracker: new TrackerMock(),
        user: new UserFacadeMock(),
        getTabStorage: jest.fn(),
        getBrowserStorage: jest.fn(),
        getLogger: jest.fn().mockReturnValue(getLoggerMock()),
    };

    Object.defineProperty(sdk.tab, 'location', {
        value: window.location,
    });

    return sdk;
}

export function getLoggerMock(): Logger {
    return {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
}
