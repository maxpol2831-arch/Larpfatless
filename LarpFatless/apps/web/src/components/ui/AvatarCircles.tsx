type AvatarCircle = {
  imageUrl: string;
  profileUrl?: string;
};

interface AvatarCirclesProps {
  avatarUrls: AvatarCircle[];
  className?: string;
  numPeople?: number;
}

export function AvatarCircles({ avatarUrls, className = "", numPeople = 0 }: AvatarCirclesProps) {
  return (
    <div className={`avatar-circles ${className}`} aria-hidden="true">
      {avatarUrls.map((avatar, index) => {
        const image = <img src={avatar.imageUrl} alt="" loading="lazy" />;
        return avatar.profileUrl ? (
          <a className="avatar-circles__item" href={avatar.profileUrl} key={`${avatar.imageUrl}-${index}`} tabIndex={-1}>
            {image}
          </a>
        ) : (
          <span className="avatar-circles__item" key={`${avatar.imageUrl}-${index}`}>
            {image}
          </span>
        );
      })}
      {numPeople > 0 && <span className="avatar-circles__count">+{numPeople}</span>}
    </div>
  );
}
