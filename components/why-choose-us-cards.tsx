'use client';

import React, {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  ReactElement,
  ReactNode,
  RefObject,
  useEffect,
  useMemo,
  useRef
} from 'react';
import gsap from 'gsap';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface CardSwapProps {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  onCardClick?: (idx: number) => void;
  skewAmount?: number;
  easing?: 'linear' | 'elastic';
  children: ReactNode;
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  customClass?: string;
  image?: string;
  imageAlt?: string;
  category?: string;
  readTime?: string;
  title?: string;
  description?: string;
  linkText?: string;
  linkHref?: string;
  isReversed?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ 
  customClass, 
  image, 
  imageAlt,
  category,
  readTime,
  title, 
  description, 
  linkText, 
  linkHref, 
  isReversed = false,
  ...rest 
}, ref) => (
  <div
    ref={ref}
    {...rest}
    className={`absolute top-1/2 left-1/2 rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md overflow-hidden group ${customClass ?? ''} ${rest.className ?? ''}`.trim()}
  >
    <div className={`flex h-full ${isReversed ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Image Section */}
      <div className="relative w-1/2 aspect-[16/7] overflow-hidden bg-muted">
        {image && (
          <Image
            src={image}
            alt={imageAlt || title || 'Card image'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
      </div>
      
      {/* Content Section */}
      <div className="w-1/2 p-5 md:p-6 flex flex-col justify-center">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-xs">
            {category && (
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 font-medium text-primary">
                {category}
              </span>
            )}
            {readTime && (
              <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">{readTime}</span>
            )}
          </div>

          <h3 className="text-pretty text-lg font-semibold leading-snug md:text-xl group-hover:text-primary transition-colors">
            {title}
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>

          {linkText && linkHref && (
            <div className="pt-1">
              <Link
                href={linkHref}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline group-hover:gap-3 transition-all"
                aria-label={`Read more: ${title}`}
              >
                {linkText}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
));
Card.displayName = 'Card';

type CardRef = RefObject<HTMLDivElement>;
interface Slot {
  x: number;
  y: number;
  z: number;
  zIndex: number;
}

const makeSlot = (i: number, distX: number, distY: number, total: number): Slot => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i
});

const placeNow = (el: HTMLElement, slot: Slot, skew: number) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true
  });

const CardSwap: React.FC<CardSwapProps> = ({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  onCardClick,
  skewAmount = 6,
  easing = 'elastic',
  children
}) => {
  const config =
    easing === 'elastic'
      ? {
          ease: 'elastic.out(0.6,0.9)',
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.7,
          returnDelay: 0.15
        }
      : {
          ease: 'power1.inOut',
          durDrop: 0.6,
          durMove: 0.6,
          durReturn: 0.6,
          promoteOverlap: 0.5,
          returnDelay: 0.1
        };

  const childArr = useMemo(() => Children.toArray(children) as ReactElement<CardProps>[], [children]);
  const refs = useMemo<CardRef[]>(() => childArr.map(() => React.createRef<HTMLDivElement>()), [childArr.length]);

  const order = useRef<number[]>(Array.from({ length: childArr.length }, (_, i) => i));

  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const intervalRef = useRef<number>();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const total = refs.length;
    refs.forEach((r, i) => placeNow(r.current!, makeSlot(i, cardDistance, verticalDistance, total), skewAmount));

    const swap = () => {
      if (order.current.length < 2) return;

      const [front, ...rest] = order.current;
      const elFront = refs[front].current!;
      const tl = gsap.timeline();
      tlRef.current = tl;

      tl.to(elFront, {
        y: '+=500',
        duration: config.durDrop,
        ease: config.ease
      });

      tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
      rest.forEach((idx, i) => {
        const el = refs[idx].current!;
        const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
        tl.set(el, { zIndex: slot.zIndex }, 'promote');
        tl.to(
          el,
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            duration: config.durMove,
            ease: config.ease
          },
          `promote+=${i * 0.15}`
        );
      });

      const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length);
      tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
      tl.call(
        () => {
          gsap.set(elFront, { zIndex: backSlot.zIndex });
        },
        undefined,
        'return'
      );
      tl.to(
        elFront,
        {
          x: backSlot.x,
          y: backSlot.y,
          z: backSlot.z,
          duration: config.durReturn,
          ease: config.ease
        },
        'return'
      );

      tl.call(() => {
        order.current = [...rest, front];
      });
    };

    swap();
    if (delay > 0) {
      intervalRef.current = window.setInterval(swap, delay);
    }

    if (pauseOnHover) {
      const node = container.current!;
      const pause = () => {
        tlRef.current?.pause();
        clearInterval(intervalRef.current);
      };
      const resume = () => {
        tlRef.current?.play();
        intervalRef.current = window.setInterval(swap, delay);
      };
      node.addEventListener('mouseenter', pause);
      node.addEventListener('mouseleave', resume);
      return () => {
        node.removeEventListener('mouseenter', pause);
        node.removeEventListener('mouseleave', resume);
        clearInterval(intervalRef.current);
      };
    }
    return () => clearInterval(intervalRef.current);
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing]);

  const rendered = childArr.map((child, i) =>
    isValidElement<CardProps>(child)
      ? cloneElement(child, {
          key: i,
          ref: refs[i],
          style: { width, height, ...(child.props.style ?? {}) },
          onClick: e => {
            child.props.onClick?.(e as React.MouseEvent<HTMLDivElement>);
            onCardClick?.(i);
          }
        } as CardProps & React.RefAttributes<HTMLDivElement>)
      : child
  );

  return (
    <div
      ref={container}
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 perspective-[900px] overflow-visible max-[1024px]:scale-[0.9] max-[768px]:scale-[0.8] max-[640px]:scale-[0.7] max-[480px]:scale-[0.6]"
      style={{ width, height }}
    >
      {rendered}
    </div>
  );
};

export default CardSwap;
