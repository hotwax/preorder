import { Plugins } from '@capacitor/core';

const { Storage } = Plugins;

const setObject = async (key: string, value: object) => {
    await Storage.set({
        key,
        value: JSON.stringify(value)
    });
}

const getObject = async (key: string) => {
    const data: any = await Storage.get({ key });
    return JSON.parse(data.value);
}

const setItem = async (key: string, value: string) => {
    await Storage.set({
        key,
        value
    });
}

const getItem = async (key: string) => {
    const { value } = await Storage.get({ key });
    return value;
}

const removeItem = async (key: string) => {
    await Storage.remove({ key });
}

const keys = async () => {
    const { keys } = await Storage.keys();
    return keys;
}

const clear = async () => {
    await Storage.clear();
}

export default {
    setObject,
    getObject,
    setItem,
    getItem,
    removeItem,
    keys,
    clear
}