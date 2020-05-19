import {Context} from '../src/context';
import {And, Constant, Contains, Not, Or, Predicate, Variable} from '../src/predicate';

describe('A variable', () => {
    test('should check whether its value is true', async () => {
        const fooVariable = new Variable('foo');
        const barVariable = new Variable('bar');
        const context = new Context({
            foo: (): Promise<any> => Promise.resolve(true),
            bar: (): Promise<any> => Promise.resolve(1),
        });

        await expect(fooVariable.test(context)).resolves.toBe(true);
        await expect(barVariable.test(context)).resolves.toBe(false);
    });

    test('should print its name and value', async () => {
        const variable = new Variable('foo');
        const context = new Context({foo: (): Promise<any> => Promise.resolve(1)});

        await expect(variable.print(context)).resolves.toBe('variable(\'foo\' = 1)');
    });

    test('can be converted to string', () => {
        const variable = new Variable('foo');

        expect(variable.toString()).toBe('variable(\'foo\')');
    });
});

describe('A constant', () => {
    test('should check whether its value is true', async () => {
        const trueConstant = new Constant(true);
        const falseConstant = new Constant(false);

        await expect(trueConstant.test()).resolves.toBe(true);
        await expect(falseConstant.test()).resolves.toBe(false);
    });

    test('should print its value', async () => {
        const constant = new Constant(true);

        await expect(constant.print()).resolves.toBe('constant(true)');
    });

    test('can be converted to string', () => {
        const constant = new Constant(true);

        expect(constant.toString()).toBe('constant(true)');
    });
});

describe('A contains-predicate', () => {
    test('should check whether its value is true', async () => {
        const context = new Context({
            foo: (): Promise<any> => Promise.resolve(['a', 'b']),
            bar: (): Promise<any> => Promise.resolve('a'),
        });

        const fooPredicate = new Contains('foo', 'a');
        await expect(fooPredicate.test(context)).resolves.toBe(true);

        const barPredicate = new Contains('bar', 'a');
        await expect(barPredicate.test(context)).resolves.toBe(false);
    });

    test('should print the expression', async () => {
        const predicate = new Contains('foo', 'a');
        const context = new Context({foo: (): Promise<any> => Promise.resolve(['a', 'b'])});

        await expect(predicate.print(context)).resolves.toBe('["a","b"] contains "a"');
    });

    test('can be converted to string', () => {
        const predicate = new Contains('foo', 'a');

        expect(predicate.toString()).toBe('foo contains "a"');
    });
});

describe('A not-predicate', () => {
    test('should negate a predicate', async () => {
        const context = new Context({});

        const truePredicate: Predicate = {
            test: jest.fn().mockResolvedValueOnce(true),
            print: jest.fn(),
            toString: jest.fn(),
        };
        const notTruePredicate = new Not(truePredicate);

        await expect(notTruePredicate.test(context)).resolves.toBe(false);

        const falsePredicate: Predicate = {
            test: jest.fn().mockResolvedValueOnce(false),
            print: jest.fn(),
            toString: jest.fn(),
        };
        const notFalsePredicate = new Not(falsePredicate);

        await expect(notFalsePredicate.test(context)).resolves.toBe(true);
    });

    test('should print the predicate prefixed by "not"', async () => {
        const predicate: Predicate = {
            test: jest.fn(),
            print: jest.fn().mockResolvedValue('1 = 2'),
            toString: jest.fn(),
        };
        const notPredicate = new Not(predicate);
        const context = new Context({});

        await expect(notPredicate.print(context)).resolves.toBe('not(1 = 2)');
    });

    test('can be converted to string', () => {
        const predicate: Predicate = {
            test: jest.fn(),
            print: jest.fn(),
            toString: (): string => 'foo = 2',
        };
        const notPredicate = new Not(predicate);

        expect(notPredicate.toString()).toBe('not(foo = 2)');
    });
});

describe('An and-predicate', () => {
    test('should evaluate to true only if all operands are true', async () => {
        const firstPredicate: Predicate = {
            test: jest.fn().mockResolvedValueOnce(true),
            print: jest.fn(),
            toString: jest.fn(),
        };
        const secondPredicate: Predicate = {
            test: jest.fn().mockResolvedValueOnce(true),
            print: jest.fn(),
            toString: jest.fn(),
        };
        const thirdPredicate: Predicate = {
            test: jest.fn().mockResolvedValueOnce(true),
            print: jest.fn(),
            toString: jest.fn(),
        };
        const andPredicate = new And(firstPredicate, secondPredicate, thirdPredicate);
        const context = new Context({});

        await expect(andPredicate.test(context)).resolves.toBe(true);
    });

    test('should evaluate to false as soon as the first operand evaluates to false', async () => {
        const firstPredicate: Predicate = {
            test: jest.fn().mockResolvedValueOnce(false),
            print: jest.fn(),
            toString: jest.fn(),
        };
        const secondPredicate: Predicate = {
            test: jest.fn().mockReturnValue(new Promise(jest.fn())),
            print: jest.fn(),
            toString: jest.fn(),
        };
        const thirdPredicate: Predicate = {
            test: jest.fn().mockResolvedValueOnce(new Promise(jest.fn())),
            print: jest.fn(),
            toString: jest.fn(),
        };
        const andPredicate = new And(firstPredicate, secondPredicate, thirdPredicate);
        const context = new Context({});

        await expect(andPredicate.test(context)).resolves.toBe(false);
    });

    test('should print all predicates joined by the disjunction "or"', async () => {
        const firstPredicate: Predicate = {
            test: jest.fn(),
            print: jest.fn().mockResolvedValue('1 = 2'),
            toString: jest.fn(),
        };
        const secondPredicate: Predicate = {
            test: jest.fn(),
            print: jest.fn().mockResolvedValue('3 = 4'),
            toString: jest.fn(),
        };
        const thirdPredicate: Predicate = {
            test: jest.fn(),
            print: jest.fn().mockResolvedValue('5 = 6'),
            toString: jest.fn(),
        };
        const andPredicate = new And(firstPredicate, secondPredicate, thirdPredicate);
        const context = new Context({});

        await expect(andPredicate.print(context)).resolves.toBe('1 = 2 and 3 = 4 and 5 = 6');
    });

    test('can be converted to string', () => {
        const firstPredicate: Predicate = {
            test: jest.fn(),
            print: jest.fn(),
            toString: (): string => 'foo = 2',
        };
        const secondPredicate: Predicate = {
            test: jest.fn(),
            print: jest.fn(),
            toString: (): string => 'bar = 4',
        };
        const thirdPredicate: Predicate = {
            test: jest.fn(),
            print: jest.fn(),
            toString: (): string => 'baz = 6',
        };
        const andPredicate = new And(firstPredicate, secondPredicate, thirdPredicate);

        expect(andPredicate.toString()).toBe('foo = 2 and bar = 4 and baz = 6');
    });
});

describe('An or-predicate', () => {
    test('should evaluate to true if at least one operand is true', async () => {
        const firstPredicate: Predicate = {
            test: jest.fn().mockResolvedValueOnce(false),
            print: jest.fn(),
            toString: jest.fn(),
        };
        const secondPredicate: Predicate = {
            test: jest.fn().mockResolvedValueOnce(false),
            print: jest.fn(),
            toString: jest.fn(),
        };
        const thirdPredicate: Predicate = {
            test: jest.fn().mockResolvedValueOnce(false),
            print: jest.fn(),
            toString: jest.fn(),
        };
        const orPredicate = new Or(firstPredicate, secondPredicate, thirdPredicate);
        const context = new Context({});

        await expect(orPredicate.test(context)).resolves.toBe(false);
    });

    test('should evaluate to true as soon as an operand evaluates to true', async () => {
        const firstPredicate: Predicate = {
            test: jest.fn().mockResolvedValueOnce(true),
            print: jest.fn(),
            toString: jest.fn(),
        };
        const secondPredicate: Predicate = {
            test: jest.fn().mockReturnValue(new Promise(jest.fn())),
            print: jest.fn(),
            toString: jest.fn(),
        };
        const thirdPredicate: Predicate = {
            test: jest.fn().mockResolvedValueOnce(new Promise(jest.fn())),
            print: jest.fn(),
            toString: jest.fn(),
        };
        const orPredicate = new Or(firstPredicate, secondPredicate, thirdPredicate);
        const context = new Context({});

        await expect(orPredicate.test(context)).resolves.toBe(true);
    });

    test('should print all predicates joined by the conjunction "and"', async () => {
        const firstPredicate: Predicate = {
            test: jest.fn(),
            print: jest.fn().mockResolvedValue('1 = 2'),
            toString: jest.fn(),
        };
        const secondPredicate: Predicate = {
            test: jest.fn(),
            print: jest.fn().mockResolvedValue('3 = 4'),
            toString: jest.fn(),
        };
        const thirdPredicate: Predicate = {
            test: jest.fn(),
            print: jest.fn().mockResolvedValue('5 = 6'),
            toString: jest.fn(),
        };
        const orPredicate = new Or(firstPredicate, secondPredicate, thirdPredicate);
        const context = new Context({});

        await expect(orPredicate.print(context)).resolves.toBe('1 = 2 or 3 = 4 or 5 = 6');
    });

    test('can be converted to string', () => {
        const firstPredicate: Predicate = {
            test: jest.fn(),
            print: jest.fn(),
            toString: (): string => 'foo = 2',
        };
        const secondPredicate: Predicate = {
            test: jest.fn(),
            print: jest.fn(),
            toString: (): string => 'bar = 4',
        };
        const thirdPredicate: Predicate = {
            test: jest.fn(),
            print: jest.fn(),
            toString: (): string => 'baz = 6',
        };
        const orPredicate = new Or(firstPredicate, secondPredicate, thirdPredicate);

        expect(orPredicate.toString()).toBe('foo = 2 or bar = 4 or baz = 6');
    });
});
