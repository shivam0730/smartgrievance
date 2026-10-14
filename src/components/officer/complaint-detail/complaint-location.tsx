import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  latitude: number;
  longitude: number;
  address: string;
};

export function ComplaintLocation({ latitude, longitude, address }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">{address}</p>
        <p className="text-xs text-muted-foreground">
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
        <a
          href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
        >
          Open in OpenStreetMap
        </a>
      </CardContent>
    </Card>
  );
}