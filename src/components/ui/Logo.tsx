// export type LogoPosition =

export interface LogoProps {
  variant: 'default' | 'symbol';
}
const Logo = ({ variant = 'default' }: LogoProps) => {
  const logoText = variant === 'symbol' ? 'TF' : 'ToneFit';

  return (
    <span className="text-2xl font-bold leading-8 tracking-tight text-text-primary text-center">
      {logoText}
    </span>
  );
};

export default Logo;
