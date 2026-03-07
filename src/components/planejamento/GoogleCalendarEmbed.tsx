interface Props {
  embedUrl: string;
  nome?: string;
}

export function GoogleCalendarEmbed({ embedUrl, nome }: Props) {
  // Ensure the URL uses embed format
  const url = embedUrl.includes('/embed') 
    ? embedUrl 
    : embedUrl.replace('/calendar/', '/calendar/embed?src=');

  return (
    <div className="w-full h-full min-h-[500px]">
      {nome && (
        <p className="text-sm font-medium text-muted-foreground mb-2">{nome}</p>
      )}
      <iframe
        src={url}
        className="w-full h-full min-h-[500px] rounded-lg border"
        frameBorder="0"
        scrolling="no"
        title={nome || 'Google Calendar'}
      />
    </div>
  );
}
