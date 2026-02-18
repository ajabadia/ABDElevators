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
     */
    static createStream(
        producer: (send: (event: string, data: any) => void) => Promise<void>,
        options: { heartbeat?: boolean; intervalMs?: number } = {}
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

        const effectiveStream = options.heartbeat
            ? this.wrapWithHeartbeat(stream, options.intervalMs)
            : stream;

        return new Response(effectiveStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    }

    /**
     * Envuelve un ReadableStream existente con un pulso de heartbeat (comentarios SSE).
     * Útil para evitar que Proxies/Load Balancers corten conexiones silentes.
     */
    static wrapWithHeartbeat(stream: ReadableStream, intervalMs = 15000): ReadableStream {
        let timer: any = null;
        const encoder = new TextEncoder();

        return new ReadableStream({
            async start(controller) {
                const reader = stream.getReader();

                const resetHeartbeat = () => {
                    if (timer) clearInterval(timer);
                    timer = setInterval(() => {
                        try {
                            controller.enqueue(encoder.encode(":\n\n"));
                        } catch (e) {
                            if (timer) clearInterval(timer);
                        }
                    }, intervalMs);
                };

                resetHeartbeat();

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            if (timer) clearInterval(timer);
                            controller.close();
                            break;
                        }
                        resetHeartbeat();
                        controller.enqueue(value);
                    }
                } catch (e) {
                    if (timer) clearInterval(timer);
                    controller.error(e);
                }
            },
            cancel() {
                if (timer) clearInterval(timer);
            }
        });
    }

    /**
     * Formatea un objeto para ser enviado como un evento SSE manual.
     */
    static formatEvent(data: any): Uint8Array {
        return this.encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
    }
}
