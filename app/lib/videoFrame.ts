// app/lib/videoFrame.ts

/** The video URL with a `#t=0.1` media fragment, so a video with no poster
 *  paints a frame from its start (not frame 0, often black) once its
 *  metadata loads. Left alone if the URL already has a fragment.
 *  Shared by the home reels row and the gallery page's video row. */
export function firstFrameSrc(url: string): string {
  return url.includes('#') ? url : `${url}#t=0.1`;
}
