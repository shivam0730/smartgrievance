import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Img = {
  id: string;
  kind: "COMPLAINT" | "RESOLUTION";
  imageUrl: string;
  fileName: string;
};

export function ComplaintImages({ images }: { images: Img[] }) {
  const citizenImgs = images.filter((i) => i.kind === "COMPLAINT");
  const resolutionImgs = images.filter((i) => i.kind === "RESOLUTION");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <section>
          <p className="text-xs font-medium text-muted-foreground">
            Citizen-submitted ({citizenImgs.length})
          </p>
          {citizenImgs.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No images.</p>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {citizenImgs.map((img) => (
                <a
                  key={img.id}
                  href={img.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
                >
                  <Image
                    src={img.imageUrl}
                    alt={img.fileName}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
          )}
        </section>

        {resolutionImgs.length > 0 && (
          <section>
            <p className="text-xs font-medium text-emerald-700">
              Resolution evidence ({resolutionImgs.length})
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {resolutionImgs.map((img) => (
                <a
                  key={img.id}
                  href={img.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-md border border-emerald-200 bg-muted"
                >
                  <Image
                    src={img.imageUrl}
                    alt={img.fileName}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}