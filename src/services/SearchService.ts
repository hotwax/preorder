import api from '@/api'

const find = async (query: any): Promise <any>  => {
    return api({
        url: "performFind", 
        method: "post",
        data: query
    });
}
const search = async (query: any): Promise <any>  => {
    return api({
        url: "solr-query", 
        method: "post",
        data: query
    });
}

export const SearchService = {
    find,
    search
}