export function __awaiter(thisArg: unknown, _arguments: unknown, P: PromiseConstructor | undefined, generatorFactory: () => Generator) {
  function adopt(value: unknown) {
    return value instanceof (P ?? Promise) ? value : new (P ?? Promise)((resolve) => resolve(value));
  }

  return new (P ?? Promise)((resolve, reject) => {
    const generator = generatorFactory.apply(thisArg, _arguments as []);

    function fulfilled(value: unknown): void {
      try {
        step(generator.next(value));
      } catch (error) {
        reject(error);
      }
    }

    function rejected(value: unknown): void {
      try {
        step(generator.throw(value));
      } catch (error) {
        reject(error);
      }
    }

    function step(result: IteratorResult<unknown>): void {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }

    step(generator.next());
  });
}

export function __rest(source: Record<string | symbol, unknown>, exclude: (string | symbol)[]) {
  const target: Record<string | symbol, unknown> = {};

  for (const property in source) {
    if (Object.prototype.hasOwnProperty.call(source, property) && exclude.indexOf(property) < 0) {
      target[property] = source[property];
    }
  }

  if (source != null && typeof Object.getOwnPropertySymbols === "function") {
    for (const property of Object.getOwnPropertySymbols(source)) {
      if (exclude.indexOf(property) < 0 && Object.prototype.propertyIsEnumerable.call(source, property)) {
        target[property] = source[property];
      }
    }
  }

  return target;
}
