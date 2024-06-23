class PromodeSystemCollectionStateError extends Error {
  constructor(message) {
    super(message);

    this.name = 'PromodeSystemCollectionStateError';
  }
}

export { PromodeSystemCollectionStateError };
