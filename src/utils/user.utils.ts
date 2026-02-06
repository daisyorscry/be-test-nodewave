export function transformRoleToEnumRole(role:string){
    switch(role){
        case "ADMIN":
            return "ADMIN"
        default:
            return "USER"
    }
}
