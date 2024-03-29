import { Injectable } from '@angular/core';

import {HttpClient, HttpParams} from '@angular/common/http';
import { Member } from './../_models/member';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import {of} from "rxjs";
import {map, reduce, take} from "rxjs/operators";
import {PaginatedResult} from "../_models/pagination";
import {UserParams} from "../_models/userParams";
import {User} from "../_models/user";
import {AccountService} from "./account.service";




// const httpOptions :{
//   headers?: HttpHeaders | {
//     [header: string]: string | string[];
//   };
//   } = {
//   headers: new HttpHeaders({ //new obj
//     Authorization: 'Bearer ' + JSON.parse(localStorage.getItem('user'))?.token  //set Authorization and fix exception null
//   })
// }

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  baseUrl = environment.apiUrl;
  members: Member[] = [];
  memberCache = new Map();
  user: User;
  userParams: UserParams;
  //paginatedResult: PaginatedResult<Member[]> = new PaginatedResult<Member[]>();
  constructor(private http: HttpClient, private accountService: AccountService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe(user =>{
      this.user = user;
      this.userParams = new UserParams(user);
    })
  }
  getUserParams(){
    return this.userParams;
  }
  setUserParams(params: UserParams){
    this.userParams = params;
  }
  resetParams(){
    this.userParams = new UserParams(this.user);
    return this.userParams;
  }

  getMembers(userParams: UserParams){
    var response = this.memberCache.get(Object.values(userParams).join('-'));
    if(response){
      return of(response);
    }
    // if(this.members.length >0) return of(this.members);
    //add pagination
    let params = this.getPaginationHeaders(userParams.pageNumber, userParams.pageSize);

    params = params.append('minAge', userParams.minAge.toString());
    params = params.append('maxAge', userParams.maxAge.toString());
    params = params.append('gender', userParams.gender);
    params = params.append('orderBy', userParams.orderBy);
    return this.getPaginatedResult<Member[]>(this.baseUrl + 'users', params)
      .pipe(map(response => {
          this.memberCache.set(Object.values(userParams).join('-'), response);
          return response;
        }))
  }

  private getPaginatedResult<T>(url, params) {
    const paginatedResult: PaginatedResult<T> = new PaginatedResult<T>();
    return this.http.get<T>(url, {observe: 'response', params}).pipe(
      //   map(members =>{
      //     this.members= members;
      //     return members;
      // })
      map(response => {
        paginatedResult.result = response.body;
        if (response.headers.get('Pagination') !== null) {
          paginatedResult.pagination = JSON.parse(response.headers.get('Pagination'));
        }
        return paginatedResult;
      })
    )
  }

//pagination services
  private getPaginationHeaders (pageNumber: number, pageSize: number){
    let params = new HttpParams();

      params = params.append('pageNumber', pageNumber.toString());
      params = params.append('pageSize', pageSize.toString());
      return params;
  }
  getMember(username: string){
    const member = this.members.find(x => x.username ===username);
    if(member !== undefined)
      return of(member);
    return this.http.get<Member>(this.baseUrl +'users/'+username);
  }
  getMemberDetail(username: string){
    // const member = this.members.find(x => x.username ===username);
    // if(member !== undefined)
    //   return of(member);
    const member = [...this.memberCache.values()]
      .reduce((arr, elem) => arr.concat(elem.result), [])
      .find((member: Member) => member.username === username);
    if(member){
      return of(member);
    }
    // console.log(member);
    return this.http.get<Member>(this.baseUrl +'users/'+username);
  }

  updateMember(member: Member){
    return this.http.put(this.baseUrl + 'users', member).pipe(
      map(() =>{
        const  index = this.members.indexOf(member);
        this.members[index] = member;
      })
    )
  }

  setMainPhoto(photoId: number){
    return this.http.put(this.baseUrl +  'users/set-main-photo/' + photoId, {});
  }

  deletePhoto(photoId: number){
    return this.http.delete(this.baseUrl + 'users/delete-photo/' + photoId);
  }
  //add like
  addLike(username: string){
    return this.http.post(this.baseUrl + 'likes/' + username, {})
  }
  getLikes (predicate: string, pageNumber, pageSize){
    let params = this.getPaginationHeaders(pageNumber, pageSize);
    params = params.append('predicate', predicate);
    return this.getPaginatedResult<Partial<Member[]>>(this.baseUrl + 'likes', params);
  }
}
