import type { PlatformId } from "../../api/endpoints";
import type { Repository } from "../collections/collectionTypes";

// One kind of data mined for a repository, which an admin can remove on its
// own (GET /api/repositories/{id}/data).
export type RepositoryDataPart = {
  platform: PlatformId;
  // Unique within the platform; names the part in the remove request.
  key: string;
  label: string;
  // What it holds, and what removing it also removes.
  description: string;
  item_count: number;
  // Items other repositories (forks) also contain; removing keeps them.
  shared_count: number;
  last_mined_at: string | null;
};

export type RepositoryRemote = {
  platform: PlatformId;
  owner: string;
  name: string;
};

export type RepositoryData = {
  repository: Repository & {
    remotes: RepositoryRemote[];
    mirror_last_synced_at?: string;
    created_at: string;
  };
  // Git's parts first, then each forge's that hosts the repository.
  parts: RepositoryDataPart[];
};
