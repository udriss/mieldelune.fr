declare module 'react-image-zoom' {
    import { FC, CSSProperties } from 'react';

    interface ReactImageZoomProps {
        width?: number;
        height?: number;
        zoomWidth?: number;
        img?: string;
        src?: string;
        zoomStyle?: string;
        zoomLensStyle?: string;
        scale?: number;
        offset?: {
            vertical?: number;
            horizontal?: number;
        };
        zoomPosition?: string;
        zoomContainerBoxShadow?: string;
        zoomContainerBorder?: string;
        alt?: string;
        style?: CSSProperties;
        zoom?: number;
    }

    const ReactImageZoom: FC<ReactImageZoomProps>;
    export default ReactImageZoom;
}