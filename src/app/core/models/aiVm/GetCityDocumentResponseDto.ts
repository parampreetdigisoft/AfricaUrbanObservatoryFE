export interface GetCityDocumentResponseDto {
  cityID: number;
  cityName: string;
  noOfUsers: number;
  noOfFiles: number;
  fileTypes: string;
  filesSize?: number; // nullable in backend
}

export interface GetCityPillarDocumentResponseDto {
  cityDocumentID: number;
  cityID: number;
  pillarID?: number;
  pillarName?: string;

  fileName: string;
  storedFileName: string;
  filePath: string;
  fileType: string;

  fileSize?: number;

  processingStatus: string;

  uploadedByUserID: number;
  uploadedBy: string;
}
