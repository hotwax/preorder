import StorageManager from '../storage-manager';
import emitter from "../event-bus"
import { client } from "../api"

const prepareTask = () => {
    const task: any = {};
    task.taskId = new Date().getTime() + '-' + Math.random();
    task.transmited = false;
    task.createdAt = new Date();
    task.updatedAt = new Date();
    return task;
}
const queueTask = async (data: any) => {
    const task = prepareTask();
    task.url = data.url;
    task.payload = data.payload;
    task.callbackEvent = data.callbackEvent;
    const tasks = await StorageManager.getObject('syncTasks');
    tasks.push(task);
    StorageManager.setObject('syncTasks', tasks);
}

const removeTask = async (task: any) => {
    let tasks = await StorageManager.getObject('syncTasks');
    tasks = tasks.filter((item: any) => {
        return item.taskId !== task.taskId;
    });
    StorageManager.setObject('syncTasks', tasks);
}

const processTask = async (task: any) => {
    // TODO Handle case for expired token and new logged in user
    client(task.payload).then((data) => {
        // Add to response as required for callbackEvent
        task.response = data;
    }).catch((error) => {
        task.error = error;
        // TODO Add error information to Task or remove it after showing message
        console.error("error", error);
    }).finally(() => {
        if (task.callback_event) {
            if (task.callbackEvent.startsWith('store:')) {
                // TODO 
                //store.dispatch(task.callback_event.split(':')[1], task)
            } else {
                emitter.emit(task.callbackEvent, task)
            }
        }
        removeTask(task);
    })
}

const processQueue = async () => {
    const tasks = await StorageManager.getObject('syncTasks');
    tasks.forEach((task: any) => {
        processTask(task);
    });
}

const init = async () => {
    let tasks = await StorageManager.getObject('syncTasks');
    if (!tasks) {
        tasks = [];
        await StorageManager.setObject('syncTasks', tasks);
    }
    emitter.on('online', processQueue);
    emitter.on('queueTask', queueTask);
}

export default {
    init,
    prepareTask,
    queueTask,
    processQueue,
    processTask,
    removeTask
}