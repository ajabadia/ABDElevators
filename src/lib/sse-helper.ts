/**
 * SSEHelper: Utilidad para manejar Server-Sent Events (SSE) en Next.js.
 * Centraliza la creación de ReadableStreams y el encoding de eventos.
 */
export class SSEHelper {
    private static encoder = new TextEncoder();

    /**
     * Crea una Response de tipo event-stream a partir de un generador.
     * Asume que el generador yield objects o strings que se envían como 'data'.
     * @deprecated Use createStream for better control over event names.
     */
    static createStreamResponse(generator: AsyncGenerator<any, void, unknown>) {
        const stream = new ReadableStream({
            async pull(controller) {
                try {
                    const { value, done } = await generator.next();

                    if (done) {
                        controller.close();
                        return;
                    }

                    // Enviar el evento en formato data: JSON\n\n
                    controller.enqueue(SSEHelper.encoder.encode(`data: ${JSON.stringify(value)}\n\n`));
                } catch (err: any) {
                    controller.error(err);
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    }

    /**
     * Crea una Response de tipo event-stream ejecutando un callback productor.
     * Permite enviar eventos con nombre específico (event: ..., data: ...).
     * 
     * @example
     * return SSEHelper.createStream(async (send) => {
     *   send('status', { msg: 'connected' });
     *   await doWork();
     *   send('complete', { result: 1 });
     * });
     */
    static createStream(
        producer: (send: (event: string, data: any) => void) => Promise<void>
    ) {
        const stream = new ReadableStream({
            async start(controller) {
                const send = (event: string, data: any) => {
                    const payload = JSON.stringify(data);
                    controller.enqueue(
                        SSEHelper.encoder.encode(`event: ${event}\ndata: ${payload}\n\n`)
                    );
                };

                try {
                    await producer(send);
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    }

    /**
     * Formatea un objeto para ser enviado como un evento SSE manual.
     */
    static formatEvent(data: any): Uint8Array {
        return this.encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
    }
}
