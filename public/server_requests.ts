interface RequestResponse<ResponseType = null>{
    return_code: number
    fetched_data?: ResponseType
    error_message?: string
}
// ProfileView
interface ProfileViewFetchResponse{
    user_info: {
        name: string,
        surname: string,
        email: string,
        card_number: string
    },
    rented_books: {
        id: number,
        title: string
        author: string[],
        return_date: Date
    }[],
    reserved_books: {
        id: number,
        title: string,
        author: string[],
        return_date: Date
    }[]
}

export function ProfileViewFetch(session_token: string): RequestResponse<ProfileViewFetchResponse>{
    return {return_code:0}
}

export function ChangeProfileInfoRequest(session_token:string,
                                         new_name: string,
                                         new_surname: string): RequestResponse{
    return {return_code: 0}
}
export function ChangeCardInfoRequest(session_token: string,
                                      card_number: string,
                                      exp_date: string,
                                      cvv: string): RequestResponse{
    // exp_date = "mm/yy"
    return {return_code: 0}
}
export function ChangePasswordRequest(session_token: string,
                                      old_password: string,
                                      new_password: string): RequestResponse{
    return {return_code: 0}
}
export function ResetPasswordRequest(email: string): RequestResponse{
  return { return_code: 0 }
}

export function CancelReservationRequest(session_token: string,
                                         instance_id: number):
    RequestResponse{
    return {return_code: 0}
}
export function ClaimReservationRequest(session_token:string,
                                        instance_id:number): RequestResponse{
    return {return_code: 0}
}
export function ProlongRentRequest(session_token:string,
                                   instance_id: number): RequestResponse{
    return {return_code: 0}
}
export function ReturnRentRequest(session_token:string): RequestResponse{
    return {return_code: 0}
}

// LoginMock
import { type User } from "./db_types";

export interface LoginResponse {
  user: User;
  token: string;
}

export function LoginRequest(email: string,
                             password: string): RequestResponse<LoginResponse> {
  // mock admin
  if (email === "admin@test.com" && password === "adminADMIN123!@#") {
    return {
      return_code: 0,
      fetched_data: {
        user: {
          type: "admin",
          name: "Admin",
          email,
        },
        token: "mock-admin-token",
      },
    };
  }

  // mock normal user
  if (email === "user@test.com" && password === "userUSER123!@#") {
    return {
      return_code: 0,
      fetched_data: {
        user: {
          type: "user",
          name: "User",
          email,
        },
        token: "mock-user-token",
      },
    };
  }

  // login failure
  return {
    return_code: 1,
    error_message: "Invalid credentials",
  };
}
