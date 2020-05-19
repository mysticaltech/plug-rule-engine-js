import {Context} from '../src/context';

describe('A context', () => {
    test('should provide the value for a variable', async () => {
        const context = new Context({
            foo: (): Promise<any> => Promise.resolve(1),
            bar: (): Promise<any> => Promise.resolve(2),
        });

        await expect(context.getVariable('foo')).resolves.toBe(1);
        await expect(context.getVariable('bar')).resolves.toBe(2);
        await expect(context.getVariable('baz')).resolves.toBeUndefined();
    });
});
