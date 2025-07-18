declare module 'pdf-parse' {
    function pdf(data: Buffer | Uint8Array | ArrayBuffer, options?: any): Promise<{ text: string }>;
    export default pdf;
}
