class RequestQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    async add(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                task,
                resolve,
                reject
            });

            if (!this.processing) {
                this.process();
            }
        });
    }

    async process() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            const { task, resolve, reject } = this.queue.shift();

            try {
                const result = await task();
                resolve(result);
            } catch (error) {
                reject(error);
            }

            // Add a small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        this.processing = false;
    }
}

export const requestQueue = new RequestQueue();