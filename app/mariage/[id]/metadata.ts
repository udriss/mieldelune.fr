import { weddings } from '@/lib/data';
import { Metadata, ResolvingMetadata } from 'next';

export const dynamic = "force-dynamic";

type Params = {
  params: {
    id: string
  }
};

export async function generateMetadata(
  { params }: Params,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = params;
  const wedding = weddings.find(w => w.id === parseInt(id));

  return {
    //metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://mieldelune.fr'),
    title: wedding?.title || 'MielDeLune',
    description: wedding?.description,
    openGraph: {
      images: [{ url: wedding?.coverImage?.toString() || '' }],
      title: wedding?.title,
      description: wedding?.description,
    },
  }
}