const MicrocmsSource = require('../microcmsSource');

const axios = require("axios");
jest.mock("axios", () => {
  return { get: jest.fn() }
});
const api = {
  loadSource: jest.fn()
}
const actions = {
  addCollection: jest.fn().mockReturnValue({
    addNode: jest.fn()
  })
}

beforeEach(() => {
  api.loadSource.mockClear();
  actions.addCollection.mockClear();
});

describe('constructor', () => {
  test('fail if serviceId is not defined', async () => {
    const options = {};

    try {
      await new MicrocmsSource(api, options)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('Missing serviceId option.')
      expect(api.loadSource.mock.calls.length).toBe(0);
    }
  });

  test('fail if endpoint is not defined', async () => {
    const options = {
      serviceId: 'a'
    };

    try {
      await new MicrocmsSource(api, options)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('Missing endpoint option.')
      expect(api.loadSource.mock.calls.length).toBe(0);
    }
  });

  test('fail if apiKey is not defined', async () => {
    const options = {
      serviceId: 'a',
      endpoint: 'b',
    };

    try {
      await new MicrocmsSource(api, options)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('Missing apiKey option.')
      expect(api.loadSource.mock.calls.length).toBe(0);
    }
  });

  test('success if base info is set', async () => {
    const options = {
      serviceId: 'a',
      endpoint: 'b',
      apiKey: 'x'
    };

    await new MicrocmsSource(api, options)
    expect(api.loadSource.mock.calls.length).toBe(1);
  });

  test('fail if type is not list nor object', async () => {
    const options = {
      serviceId: 'a',
      endpoint: 'b',
      apiKey: 'x',
      type: 'number'
    };

    try {
      await new MicrocmsSource(api, options)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('Type option must be list or object.')
      expect(api.loadSource.mock.calls.length).toBe(0);
    }
  });

  test('success if type is object', async () => {
    const options = {
      serviceId: 'a',
      endpoint: 'b',
      apiKey: 'x',
      type: 'object'
    };

    await new MicrocmsSource(api, options)
    expect(api.loadSource.mock.calls.length).toBe(1);
  });

  test('fail if limit is string', async () => {
    const options = {
      serviceId: 'a',
      endpoint: 'b',
      apiKey: 'x',
      limit: ''
    };

    try {
      await new MicrocmsSource(api, options)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('limit option must be number and 1 ≦ limit ≦ 1000.')
      expect(api.loadSource.mock.calls.length).toBe(0);
    }
  });

  test('fail if limit < 1', async () => {
    const options = {
      serviceId: 'a',
      endpoint: 'b',
      apiKey: 'x',
      limit: 0
    };

    try {
      await new MicrocmsSource(api, options)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('limit option must be number and 1 ≦ limit ≦ 1000.')
      expect(api.loadSource.mock.calls.length).toBe(0);
    }
  });

  test('fail if limit > 1000', async () => {
    const options = {
      serviceId: 'a',
      endpoint: 'b',
      apiKey: 'x',
      limit: 1001
    };

    try {
      await new MicrocmsSource(api, options)
      expect(true).toBe(false)
    } catch (e) {
      expect(e.message).toBe('limit option must be number and 1 ≦ limit ≦ 1000.')
      expect(api.loadSource.mock.calls.length).toBe(0);
    }
  });

  test('success if limit = 1', async () => {
    const options = {
      serviceId: 'a',
      endpoint: 'b',
      apiKey: 'x',
      limit: 1
    };

    await new MicrocmsSource(api, options)
    expect(api.loadSource.mock.calls.length).toBe(1);
  });
});

describe('getData', () => {
  test('fail if response get error', async () => {
    const dummyResponse = Promise.resolve({
      status: 400,
      body: {}
    });
    axios.get.mockImplementation(() => dummyResponse);

    const options = {
      serviceId: 'a',
      endpoint: 'b',
      apiKey: 'x',
      limit: 100,
    };

    const source = new MicrocmsSource(api, options)
    try {
      await source.getData(
        actions,
        'https://some-serever/some-endpoint',
        options
      );
      expect(true).toBe(false)
    } catch (e) {
      expect(api.loadSource.mock.calls.length).toBe(1);
      expect(e.message).toMatch(/^Failed to load. status code: /)
    }
  });

  test('fail if type miss match', async () => {
    const dummyResponse = Promise.resolve({
      status: 200,
      data: { contents: {} }
    });
    axios.get.mockImplementation(() => dummyResponse);

    const options = {
      serviceId: 'a',
      endpoint: 'b',
      apiKey: 'x',
      type: 'list',
      limit: 100
    };

    const source = new MicrocmsSource(api, options)
    try {
      await source.getData(
        actions,
        'https://some-serever/some-endpoint',
        options
      );
      expect(true).toBe(false)
    } catch (e) {
      expect(api.loadSource.mock.calls.length).toBe(1);
      expect(e.message).toMatch('options.type is list but got not array')
    }
  });

  test('success if type is object', async () => {
    const dummyResponse = Promise.resolve({
      status: 200,
      data: {},
    });
    axios.get.mockImplementation(() => dummyResponse);

    const options = {
      serviceId: 'a',
      endpoint: 'b',
      apiKey: 'x',
      type: 'object'
    };

    const source = new MicrocmsSource(api, options)
    await source.getData(
      actions,
      'https://some-serever/some-endpoint',
      options
    );
    expect(api.loadSource.mock.calls.length).toBe(1);
    expect(actions.addCollection.mock.calls.length).toBe(1);
  });

  test('success if type is list', async () => {
    const dummyResponse = Promise.resolve({
      status: 200,
      data: {
        contents: [
          {}
        ],
        totalCount: 1
      },
    });
    axios.get.mockImplementation(() => dummyResponse);

    const options = {
      serviceId: 'a',
      endpoint: 'b',
      apiKey: 'x',
      limit: 10,
      type: 'list'
    };

    const source = new MicrocmsSource(api, options)
    await source.getData(
      actions,
      'https://some-serever/some-endpoint',
      options
    );
    expect(api.loadSource.mock.calls.length).toBe(1);
    expect(actions.addCollection.mock.calls.length).toBe(1);
  });

  test('success if type is list and over limit size', async () => {
    const dummyResponse = Promise.resolve({
      status: 200,
      data: {
        contents: [
          {}, {}, {} 
        ],
        totalCount: 12
      },
    });
    axios.get.mockImplementation(() => dummyResponse);

    const options = {
      serviceId: 'a',
      endpoint: 'b',
      apiKey: 'x',
      limit: 3,
      type: 'list'
    };

    const source = new MicrocmsSource(api, options)
    await source.getData(
      actions,
      'https://some-serever/some-endpoint',
      options
    );
    expect(api.loadSource.mock.calls.length).toBe(1);
    expect(actions.addCollection.mock.calls.length).toBe(1);
  });

  test('success if type is list without totalCount', async () => {
    const dummyResponse = Promise.resolve({
      status: 200,
      data: {
        contents: [
          {}, {}, {} 
        ],
      },
    });
    axios.get.mockImplementation(() => dummyResponse);

    const options = {
      serviceId: 'a',
      endpoint: 'b',
      apiKey: 'x',
      limit: 3,
      type: 'list'
    };

    const source = new MicrocmsSource(api, options)
    await source.getData(
      actions,
      'https://some-serever/some-endpoint',
      options
    );
    expect(api.loadSource.mock.calls.length).toBe(1);
    expect(actions.addCollection.mock.calls.length).toBe(1);
  });

  test('fail if type is missing', async () => {
    const dummyResponse = Promise.resolve({
      status: 200,
      data: {
        contents: [
          {}, {}, {} 
        ],
      },
    });
    axios.get.mockImplementation(() => dummyResponse);

    const options = {
      serviceId: 'a',
      endpoint: 'b',
      apiKey: 'x',
      limit: 3,
    };

    const source = new MicrocmsSource(api, options)
    try {
      await source.getData(
        actions,
        'https://some-serever/some-endpoint',
        options
      );
      expect(true).toBe(false)
    } catch (e) {
      expect(api.loadSource.mock.calls.length).toBe(1);
      expect(e.message).toMatch(/^Passed options.type is strange./)
    }
  });
});

