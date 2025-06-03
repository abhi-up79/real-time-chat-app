import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Mock<T = any, Y extends any[] = any> {
      mockResolvedValue(value: T): Mock<T, Y>;
      mockRejectedValue(value: any): Mock<T, Y>;
      mockImplementation(fn: (...args: Y) => T): Mock<T, Y>;
      mockReset(): void;
    }
  }
}

export {}; 