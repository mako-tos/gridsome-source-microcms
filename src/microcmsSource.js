const axios = require("axios");

class MicrocmsSource {
  static defaultOptions() {
    return {
      serviceId: "",
      version: 1,
      endpoint: "",
      type: "list",
      limit: 100,
      apiKey: "",
    };
  }

  constructor(api, options) {
    options = { ...MicrocmsSource.defaultOptions(), ...options };

    if (!options.serviceId) {
      throw new Error(`Missing serviceId option.`);
    }
    if (!options.endpoint) {
      throw new Error(`Missing endpoint option.`);
    }
    if (!options.apiKey) {
      throw new Error(`Missing apiKey option.`);
    }

    if (options.type !== "list" && options.type !== "object") {
      throw new Error(`Type option must be list or object.`);
    }

    if (isNaN(options.limit) || options.limit < 1 || 1000 < options.limit) {
      throw new Error(`limit option must be number and 1 ≦ limit ≦ 1000.`);
    }

    const baseUrl = `https://${options.serviceId}.microcms.io/api/v${options.version}/${options.endpoint}`;

    api.loadSource(async (actions) => {
      await this.getData(actions, baseUrl, options);
    });
  }

  pascalCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  __ID() {
    return '_' + Math.random().toString(36).substr(2, 9);
  };

  ID() {
    return this.__ID() + '-' + this.__ID();
  }

  async getData(actions, url, options) {
    let offset = 0;
    const collection = actions.addCollection({
      typeName: "microcms" + this.pascalCase(options.endpoint),
    });
    while (true) {
      const accessURL = new URL(url);
      accessURL.searchParams.set("offset", offset);
      accessURL.searchParams.set("limit", options.limit);
      const { data, status } = await axios.get(accessURL.toString(), {
        headers: { "X-API-KEY": options.apiKey },
      });
      if (status !== 200) {
        throw new Error(`Failed to load. status code: ${status}`);
      }

      if (options.type === "list") {
        if (!Array.isArray(data.contents)) {
          throw new Error("options.type is list but got not array");
        }
        for (const item of data.contents) {
          collection.addNode({
            ...item,
            id: this.ID(),
            microcmsId: item.id,
          });
        }
        if (!data.totalCount) {
          break;
        }
        offset += options.limit;
        if (offset >= data.totalCount) {
          break;
        }
      } else if (options.type === "object") {
        collection.addNode({ ...data });
        break;
      } else {
        throw new Error("Passed options.type is strange.", options.type);
      }
    }
  }
}

module.exports = MicrocmsSource;
