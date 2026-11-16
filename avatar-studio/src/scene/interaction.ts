/* Head-turn state written by the drag handler (CameraRig) and read by the avatar each frame.
   Plain module state: changes every pointermove, never needs a React render. */
export const headTurn = { yaw: 0, pitch: 0, dragging: false }
