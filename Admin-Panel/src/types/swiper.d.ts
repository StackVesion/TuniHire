declare module 'swiper/react' {
  import { ReactElement, Component } from 'react';
  import { SwiperOptions } from 'swiper';

  interface SwiperProps extends SwiperOptions {
    children?: ReactElement | ReactElement[];
    [key: string]: any;
  }

  export class Swiper extends Component<SwiperProps> {}
  export class SwiperSlide extends Component<any> {}
}

declare module 'swiper/css';
declare module 'swiper/css/navigation';
declare module 'swiper/css/pagination';
declare module 'swiper/css/scrollbar';
declare module 'swiper/css/effect-cube';
declare module 'swiper/css/effect-fade';
declare module 'swiper/css/effect-flip';
declare module 'swiper/css/effect-coverflow';
declare module 'swiper/css/free-mode';
declare module 'swiper/css/thumbs';
