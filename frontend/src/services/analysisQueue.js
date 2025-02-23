class AnalysisQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.activeRequest = null;
    }

    async add(requestData) {
        // Check if similar request is already in queue
        const existingRequest = this.queue.find(item => 
            item.requestData.type === requestData.type &&
            item.requestData.data.groupKey === requestData.data.groupKey
        );

        if (existingRequest) {
            return existingRequest.promise;
        }

        // Create new request promise
        const requestPromise = new Promise((resolve, reject) => {
            this.queue.push({
                requestData,
                resolve,
                reject,
                promise: requestPromise
            });
        });

        if (!this.isProcessing) {
            this.processQueue();
        }

        return requestPromise;
    }

    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const { requestData, resolve, reject } = this.queue.shift();

        try {
            console.log('Processing analysis request:', requestData.type);
            
            const response = await fetch('http://localhost:5000/api/ollama/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }

            resolve(result);
        } catch (error) {
            console.error('Queue processing error:', error);
            reject(error);
        } finally {
            this.isProcessing = false;
            // Wait before processing next request
            setTimeout(() => {
                if (this.queue.length > 0) {
                    this.processQueue();
                }
            }, 1000);
        }
    }
}

export const analysisQueue = new AnalysisQueue();