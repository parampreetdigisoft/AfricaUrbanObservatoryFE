
export interface RegisterDto {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: number;
}

export interface InviteUserDto extends RegisterDto {
  invitedUserID: number;
  cityID: number[]; 
}

export interface UpdateInviteUserDto extends InviteUserDto {
  userID: number;
}
export interface InviteBulkUserDto {
  users: InviteUserDto[];
}
export interface SendRequestMailToUpdateCity {
    userID: number;
    mailToUserID: number;
    userCityMappingID: number;
}
