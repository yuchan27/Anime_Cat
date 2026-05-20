import React from 'react';
import { Composition } from 'remotion';
import { CatLoop } from './CatLoop';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CatLoop"
      component={CatLoop}
      durationInFrames={300}
      fps={30}
      width={1600}
      height={900}
      defaultProps={{
        title: 'CAT FUTURE LAB',
        subtitle: 'REMOTION LOOP MATERIAL'
      }}
    />
  );
};
