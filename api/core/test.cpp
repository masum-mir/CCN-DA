#include <bits/stdc++.h>
using namespace std;

int main() {
    int t; cin >>t;
    while(t--) {
        int n;cin>>n;
 
        if(n>3) {
            float temp1 = floor(n/2);
            float temp2 = ceil(n/2);
            cout << temp1 <<" "<< temp2 <<endl;
            cout << temp2-temp1 <<endl;
        } else {
            cout << n <<endl;
        }
    }
	
}

 