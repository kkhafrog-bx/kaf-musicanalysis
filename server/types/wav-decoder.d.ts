declare module "wav-decoder" {
  interface DecodedAudio {
    sampleRate: number;
    channelData: Float32Array[];
  }

  function decode(buffer: ArrayBuffer | Buffer): Promise<DecodedAudio>;
  export default { decode };
}
