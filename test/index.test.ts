import croct from '@croct/plug';
import '../src/index';

jest.mock('@croct/plug', () => ({
    default: {
        extend: jest.fn(),
    },
}));

describe('A rule engine plugin', () => {
    test('should self-register', async () => {
        await expect(croct.extend).toBeCalledWith('rules', expect.anything());
    });
});
