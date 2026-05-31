import React from 'react';
import { Composition } from 'remotion';
import { BuildProcess } from './BuildProcess';
import { CatLoop } from './CatLoop';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CatLoop"
        component={CatLoop}
        durationInFrames={540}
        fps={30}
        width={1600}
        height={900}
        defaultProps={{
          title: 'CAT FUTURE LAB',
          subtitle: '城市訊號互動觀測影像'
        }}
      />
      <Composition
        id="BuildProcess"
        component={BuildProcess}
        durationInFrames={360}
        fps={30}
        width={1600}
        height={900}
      />
    </>
  );
};
